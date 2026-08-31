-- Nuede V2 Cycle 4: database-owned auditing for authenticated product management.
-- Catalog authorization remains the Cycle 3 RLS policy set; browser clients do not
-- receive permission to create trusted audit rows directly.

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
  -- Trusted backend and migration work has no end-user JWT. Those operations remain
  -- possible without forging an administrator audit actor.
  if actor_id is null then
    return new;
  end if;

  select admin_user.email
    into actor_email
  from public.admin_users as admin_user
  where admin_user.id = actor_id
    and admin_user.is_active
    and admin_user.role in ('owner', 'admin', 'editor');

  if actor_email is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    insert into public.admin_audit_log (
      admin_user_id,
      admin_email_snapshot,
      action,
      entity_type,
      entity_id,
      previous_values,
      new_values
    ) values (
      actor_id,
      actor_email,
      'product_created',
      'product',
      new.id,
      null,
      to_jsonb(new) - 'created_at' - 'updated_at'
    );
    return new;
  end if;

  if old.price_kobo is distinct from new.price_kobo then
    insert into public.admin_audit_log (
      admin_user_id, admin_email_snapshot, action, entity_type, entity_id,
      previous_values, new_values
    ) values (
      actor_id, actor_email, 'product_price_changed', 'product', new.id,
      jsonb_build_object('price_kobo', old.price_kobo),
      jsonb_build_object('price_kobo', new.price_kobo)
    );
  end if;

  if old.status is distinct from new.status then
    insert into public.admin_audit_log (
      admin_user_id, admin_email_snapshot, action, entity_type, entity_id,
      previous_values, new_values
    ) values (
      actor_id,
      actor_email,
      case
        when new.status = 'archived' then 'product_archived'
        when old.status = 'archived' then 'product_restored'
        else 'product_status_changed'
      end,
      'product',
      new.id,
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  end if;

  if row(
    old.category_id, old.name, old.slug, old.description, old.calories,
    old.protein_g, old.carbohydrates_g, old.fat_g
  ) is distinct from row(
    new.category_id, new.name, new.slug, new.description, new.calories,
    new.protein_g, new.carbohydrates_g, new.fat_g
  ) then
    insert into public.admin_audit_log (
      admin_user_id, admin_email_snapshot, action, entity_type, entity_id,
      previous_values, new_values
    ) values (
      actor_id,
      actor_email,
      'product_updated',
      'product',
      new.id,
      to_jsonb(old) - 'created_at' - 'updated_at' - 'price_kobo' - 'status',
      to_jsonb(new) - 'created_at' - 'updated_at' - 'price_kobo' - 'status'
    );
  end if;

  return new;
end;
$$;

alter function private.audit_product_change() owner to postgres;
revoke all on function private.audit_product_change() from public, anon, authenticated;

comment on function private.audit_product_change() is
  'Writes trusted Cycle 4 product create, edit, price, archive, restore, and status audit events for active admins.';

create trigger products_write_audit
after insert or update on public.products
for each row execute function private.audit_product_change();
