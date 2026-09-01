-- Nuede V2 Cycle 5: complete catalog images, grouped variants, and add-ons.
-- Existing Cycle 2 catalog tables remain authoritative; this migration adds the
-- missing operational safeguards, atomic admin helpers, Storage configuration,
-- and trusted audit coverage.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on column public.products.image_path is
  'Object path in the public product-images Supabase Storage bucket; never a project-specific URL.';
comment on column public.product_variants.image_path is
  'Object path in the public product-images Supabase Storage bucket; never a project-specific URL.';

create policy product_images_public_select
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

create policy product_images_active_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (select private.is_active_admin())
  and name ~ '^(products|variants)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f-]+\.(jpg|jpeg|png|webp|avif)$'
);

create policy product_images_active_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and (select private.is_active_admin())
)
with check (
  bucket_id = 'product-images'
  and (select private.is_active_admin())
  and name ~ '^(products|variants)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f-]+\.(jpg|jpeg|png|webp|avif)$'
);

create policy product_images_active_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (select private.is_active_admin())
);

create or replace function public.validate_product_default_variant()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.default_variant_id is not null and not exists (
    select 1
    from public.product_variants as variant
    where variant.id = new.default_variant_id
      and variant.product_id = new.id
      and variant.status = 'available'
      and variant.price_kobo is not null
  ) then
    raise exception using
      errcode = '23514',
      constraint = 'products_default_variant_belongs_to_product',
      message = 'A default variant must be an available, priced variant belonging to its grouped product.';
  end if;

  return new;
end;
$$;

create or replace function private.validate_grouped_product_orderability()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.product_type = 'grouped'
    and new.status = 'available'
    and not exists (
      select 1
      from public.product_variants as variant
      where variant.product_id = new.id
        and variant.status = 'available'
        and variant.price_kobo is not null
    )
  then
    raise exception using
      errcode = '23514',
      constraint = 'grouped_product_requires_orderable_variant',
      message = 'A grouped meal cannot be available without at least one available, priced variant.';
  end if;

  return new;
end;
$$;

create trigger products_validate_grouped_orderability
before insert or update of product_type, status on public.products
for each row execute function private.validate_grouped_product_orderability();

create or replace function private.protect_grouped_variant_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_status text;
  parent_default_variant_id uuid;
  remaining_orderable integer;
begin
  if tg_op = 'UPDATE' and old.product_id is distinct from new.product_id then
    raise exception using
      errcode = '23514',
      constraint = 'product_variant_parent_is_stable',
      message = 'A variant cannot be moved to another grouped meal.';
  end if;

  select product.status, product.default_variant_id
    into parent_status, parent_default_variant_id
  from public.products as product
  where product.id = old.product_id;

  if parent_default_variant_id = old.id and (
    tg_op = 'DELETE'
    or new.status <> 'available'
    or new.price_kobo is null
  ) then
    raise exception using
      errcode = '23514',
      constraint = 'grouped_product_default_variant_must_remain_orderable',
      message = 'Choose another default variant or require explicit selection before making this variant unavailable.';
  end if;

  if parent_status = 'available' and (
    tg_op = 'DELETE'
    or new.status <> 'available'
    or new.price_kobo is null
  ) then
    select count(*)::integer
      into remaining_orderable
    from public.product_variants as variant
    where variant.product_id = old.product_id
      and variant.id <> old.id
      and variant.status = 'available'
      and variant.price_kobo is not null;

    if remaining_orderable = 0 then
      raise exception using
        errcode = '23514',
        constraint = 'grouped_product_requires_orderable_variant',
        message = 'This is the grouped meal''s final orderable variant. Hide or mark the group unavailable first.';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger product_variants_protect_grouped_transition
before update of product_id, price_kobo, status or delete on public.product_variants
for each row execute function private.protect_grouped_variant_transition();

create or replace function public.reorder_product_variants(
  p_product_id uuid,
  p_variant_ids uuid[]
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  existing_count integer;
  requested_count integer := coalesce(cardinality(p_variant_ids), 0);
  distinct_count integer;
begin
  if not (select private.is_active_admin()) then
    raise exception using errcode = '42501', message = 'Active administrator access is required.';
  end if;

  if not exists (
    select 1 from public.products
    where id = p_product_id and product_type = 'grouped'
  ) then
    raise exception using errcode = '23514', message = 'Variant ordering requires a grouped product.';
  end if;

  select count(*)::integer into existing_count
  from public.product_variants
  where product_id = p_product_id;

  select count(distinct requested_id)::integer into distinct_count
  from unnest(coalesce(p_variant_ids, array[]::uuid[])) as requested(requested_id);

  if requested_count <> existing_count or distinct_count <> existing_count or exists (
    select 1
    from unnest(coalesce(p_variant_ids, array[]::uuid[])) as requested(requested_id)
    where not exists (
      select 1 from public.product_variants
      where id = requested.requested_id and product_id = p_product_id
    )
  ) then
    raise exception using
      errcode = '23514',
      constraint = 'product_variant_reorder_exact_set_required',
      message = 'Variant ordering must contain every variant in this grouped meal exactly once.';
  end if;

  update public.product_variants as variant
  set sort_order = (requested.ordinality * 10)::integer
  from unnest(p_variant_ids) with ordinality as requested(id, ordinality)
  where variant.id = requested.id
    and variant.product_id = p_product_id;
end;
$$;

create or replace function public.replace_product_addon_assignments(
  p_product_id uuid,
  p_addon_ids uuid[]
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  requested_count integer := coalesce(cardinality(p_addon_ids), 0);
  distinct_count integer;
begin
  if not (select private.is_active_admin()) then
    raise exception using errcode = '42501', message = 'Active administrator access is required.';
  end if;

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception using errcode = '23514', message = 'Add-ons can only be assigned to an existing product or grouped meal.';
  end if;

  select count(distinct requested_id)::integer into distinct_count
  from unnest(coalesce(p_addon_ids, array[]::uuid[])) as requested(requested_id);

  if requested_count <> distinct_count or exists (
    select 1
    from unnest(coalesce(p_addon_ids, array[]::uuid[])) as requested(requested_id)
    where not exists (select 1 from public.product_addons where id = requested.requested_id)
  ) then
    raise exception using
      errcode = '23514',
      constraint = 'product_addon_assignment_valid_set_required',
      message = 'Every assigned add-on must be a unique existing add-on.';
  end if;

  delete from public.product_addon_assignments
  where product_id = p_product_id;

  insert into public.product_addon_assignments (product_id, addon_id, sort_order)
  select p_product_id, requested.id, (requested.ordinality * 10)::integer
  from unnest(coalesce(p_addon_ids, array[]::uuid[])) with ordinality as requested(id, ordinality);
end;
$$;

revoke all on function public.reorder_product_variants(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_product_variants(uuid, uuid[]) to authenticated;
revoke all on function public.replace_product_addon_assignments(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.replace_product_addon_assignments(uuid, uuid[]) to authenticated;

revoke all on function private.validate_grouped_product_orderability() from public, anon, authenticated;
revoke all on function private.protect_grouped_variant_transition() from public, anon, authenticated;

create or replace function private.audit_product_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text;
begin
  if actor_id is null then return new; end if;

  select email into actor_email
  from public.admin_users
  where id = actor_id and is_active and role in ('owner', 'admin', 'editor');

  if actor_email is null then return new; end if;

  if tg_op = 'INSERT' then
    insert into public.admin_audit_log (
      admin_user_id, admin_email_snapshot, action, entity_type, entity_id, new_values
    ) values (
      actor_id, actor_email,
      case when new.product_type = 'grouped' then 'grouped_product_created' else 'product_created' end,
      'product', new.id, to_jsonb(new) - 'created_at' - 'updated_at'
    );
    return new;
  end if;

  if old.price_kobo is distinct from new.price_kobo then
    insert into public.admin_audit_log (
      admin_user_id, admin_email_snapshot, action, entity_type, entity_id, previous_values, new_values
    ) values (
      actor_id, actor_email, 'product_price_changed', 'product', new.id,
      jsonb_build_object('price_kobo', old.price_kobo),
      jsonb_build_object('price_kobo', new.price_kobo)
    );
  end if;

  if old.status is distinct from new.status then
    insert into public.admin_audit_log (
      admin_user_id, admin_email_snapshot, action, entity_type, entity_id, previous_values, new_values
    ) values (
      actor_id, actor_email,
      case
        when new.status = 'archived' then 'product_archived'
        when old.status = 'archived' then 'product_restored'
        else 'product_status_changed'
      end,
      'product', new.id,
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  end if;

  if row(
    old.category_id, old.product_type, old.name, old.slug, old.description,
    old.calories, old.protein_g, old.carbohydrates_g, old.fat_g,
    old.image_path, old.requires_variant_selection, old.default_variant_id
  ) is distinct from row(
    new.category_id, new.product_type, new.name, new.slug, new.description,
    new.calories, new.protein_g, new.carbohydrates_g, new.fat_g,
    new.image_path, new.requires_variant_selection, new.default_variant_id
  ) then
    insert into public.admin_audit_log (
      admin_user_id, admin_email_snapshot, action, entity_type, entity_id, previous_values, new_values
    ) values (
      actor_id, actor_email,
      case when new.product_type = 'grouped' then 'grouped_product_updated' else 'product_updated' end,
      'product', new.id,
      to_jsonb(old) - 'created_at' - 'updated_at' - 'price_kobo' - 'status',
      to_jsonb(new) - 'created_at' - 'updated_at' - 'price_kobo' - 'status'
    );
  end if;

  return new;
end;
$$;

create or replace function private.audit_variant_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text;
begin
  if actor_id is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  select email into actor_email from public.admin_users
  where id = actor_id and is_active and role in ('owner', 'admin', 'editor');
  if actor_email is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    insert into public.admin_audit_log (
      admin_user_id, admin_email_snapshot, action, entity_type, entity_id, new_values
    ) values (
      actor_id, actor_email, 'variant_created', 'product_variant', new.id,
      to_jsonb(new) - 'created_at' - 'updated_at'
    );
    return new;
  end if;

  if tg_op = 'DELETE' then
    insert into public.admin_audit_log (
      admin_user_id, admin_email_snapshot, action, entity_type, entity_id, previous_values
    ) values (
      actor_id, actor_email, 'variant_removed', 'product_variant', old.id,
      to_jsonb(old) - 'created_at' - 'updated_at'
    );
    return old;
  end if;

  if old.price_kobo is distinct from new.price_kobo then
    insert into public.admin_audit_log (
      admin_user_id, admin_email_snapshot, action, entity_type, entity_id, previous_values, new_values
    ) values (
      actor_id, actor_email, 'variant_price_changed', 'product_variant', new.id,
      jsonb_build_object('price_kobo', old.price_kobo), jsonb_build_object('price_kobo', new.price_kobo)
    );
  end if;

  if old.status is distinct from new.status then
    insert into public.admin_audit_log (
      admin_user_id, admin_email_snapshot, action, entity_type, entity_id, previous_values, new_values
    ) values (
      actor_id, actor_email, 'variant_status_changed', 'product_variant', new.id,
      jsonb_build_object('status', old.status), jsonb_build_object('status', new.status)
    );
  end if;

  if old.sort_order is distinct from new.sort_order then
    insert into public.admin_audit_log (
      admin_user_id, admin_email_snapshot, action, entity_type, entity_id, previous_values, new_values
    ) values (
      actor_id, actor_email, 'variant_reordered', 'product_variant', new.id,
      jsonb_build_object('sort_order', old.sort_order), jsonb_build_object('sort_order', new.sort_order)
    );
  end if;

  if row(
    old.name, old.description, old.calories, old.protein_g,
    old.carbohydrates_g, old.fat_g, old.image_path
  ) is distinct from row(
    new.name, new.description, new.calories, new.protein_g,
    new.carbohydrates_g, new.fat_g, new.image_path
  ) then
    insert into public.admin_audit_log (
      admin_user_id, admin_email_snapshot, action, entity_type, entity_id, previous_values, new_values
    ) values (
      actor_id, actor_email, 'variant_updated', 'product_variant', new.id,
      to_jsonb(old) - 'created_at' - 'updated_at' - 'price_kobo' - 'status' - 'sort_order',
      to_jsonb(new) - 'created_at' - 'updated_at' - 'price_kobo' - 'status' - 'sort_order'
    );
  end if;

  return new;
end;
$$;

create or replace function private.audit_addon_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text;
begin
  if actor_id is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  select email into actor_email from public.admin_users
  where id = actor_id and is_active and role in ('owner', 'admin', 'editor');
  if actor_email is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  insert into public.admin_audit_log (
    admin_user_id, admin_email_snapshot, action, entity_type, entity_id, previous_values, new_values
  ) values (
    actor_id, actor_email,
    case when tg_op = 'INSERT' then 'addon_created' when tg_op = 'DELETE' then 'addon_removed' else 'addon_updated' end,
    'product_addon', case when tg_op = 'DELETE' then old.id else new.id end,
    case when tg_op = 'INSERT' then null else to_jsonb(old) - 'created_at' - 'updated_at' end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) - 'created_at' - 'updated_at' end
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function private.audit_addon_assignment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text;
begin
  if actor_id is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  select email into actor_email from public.admin_users
  where id = actor_id and is_active and role in ('owner', 'admin', 'editor');
  if actor_email is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  insert into public.admin_audit_log (
    admin_user_id, admin_email_snapshot, action, entity_type, entity_id, previous_values, new_values
  ) values (
    actor_id, actor_email,
    case when tg_op = 'INSERT' then 'addon_assigned' else 'addon_unassigned' end,
    'product_addon_assignment',
    case when tg_op = 'DELETE' then old.product_id else new.product_id end,
    case when tg_op = 'INSERT' then null else jsonb_build_object('addon_id', old.addon_id) end,
    case when tg_op = 'DELETE' then null else jsonb_build_object('addon_id', new.addon_id, 'sort_order', new.sort_order) end
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

alter function private.audit_product_change() owner to postgres;
alter function private.audit_variant_change() owner to postgres;
alter function private.audit_addon_change() owner to postgres;
alter function private.audit_addon_assignment_change() owner to postgres;

revoke all on function private.audit_variant_change() from public, anon, authenticated;
revoke all on function private.audit_addon_change() from public, anon, authenticated;
revoke all on function private.audit_addon_assignment_change() from public, anon, authenticated;

create trigger product_variants_write_audit
after insert or update or delete on public.product_variants
for each row execute function private.audit_variant_change();

create trigger product_addons_write_audit
after insert or update or delete on public.product_addons
for each row execute function private.audit_addon_change();

create trigger product_addon_assignments_write_audit
after insert or delete on public.product_addon_assignments
for each row execute function private.audit_addon_assignment_change();
