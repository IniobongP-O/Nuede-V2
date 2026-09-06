-- Make permanent catalog deletion a first-class audited admin operation.
-- Existing foreign keys cascade variants and assignments while historical
-- order-item product/variant references become null and snapshots remain.

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
  if actor_id is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  select email into actor_email
  from public.admin_users
  where id = actor_id and is_active and role in ('owner', 'admin', 'editor');

  if actor_email is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

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

  if tg_op = 'DELETE' then
    insert into public.admin_audit_log (
      admin_user_id, admin_email_snapshot, action, entity_type, entity_id, previous_values
    ) values (
      actor_id, actor_email,
      case when old.product_type = 'grouped' then 'grouped_product_removed' else 'product_removed' end,
      'product', old.id, to_jsonb(old) - 'created_at' - 'updated_at'
    );
    return old;
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

alter function private.audit_product_change() owner to postgres;
revoke all on function private.audit_product_change() from public, anon, authenticated;

drop trigger if exists products_write_audit on public.products;
create trigger products_write_audit
after insert or update or delete on public.products
for each row execute function private.audit_product_change();

comment on function private.audit_product_change() is
  'Writes trusted product create, edit, price, status, archive, restore, and permanent-deletion audit events for active admins.';
