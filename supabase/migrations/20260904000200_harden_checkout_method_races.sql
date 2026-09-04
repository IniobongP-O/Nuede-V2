-- Cycle 18: enforce method availability at the permanent-order boundary.
-- The row lock serializes creation with concurrent admin settings changes.
-- Existing attempts remain verifiable: this trigger only runs on INSERT.
create or replace function private.enforce_order_payment_method()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.checkout_settings
  where id and (
    (new.payment_method = 'paystack' and paystack_enabled)
    or (new.payment_method = 'whatsapp' and whatsapp_enabled)
  )
  for share;
  if not found then
    raise exception using errcode = 'P0001', message = 'PAYMENT_METHOD_DISABLED';
  end if;
  return new;
end;
$$;

alter function private.enforce_order_payment_method() owner to postgres;
revoke all on function private.enforce_order_payment_method() from public, anon, authenticated;
create trigger enforce_order_payment_method
before insert on public.orders
for each row execute function private.enforce_order_payment_method();

-- The feature specification excludes editors from payment settings by default.
-- Owner/admin roles carry this permission; no client can grant itself a role.
create or replace function private.can_manage_checkout_settings()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where id = (select auth.uid()) and is_active and role in ('owner', 'admin')
  );
$$;
alter function private.can_manage_checkout_settings() owner to postgres;
revoke all on function private.can_manage_checkout_settings() from public, anon, authenticated;
grant execute on function private.can_manage_checkout_settings() to authenticated;
drop policy checkout_settings_active_admin_update on public.checkout_settings;
create policy checkout_settings_active_admin_update on public.checkout_settings
for update to authenticated
using ((select private.can_manage_checkout_settings()))
with check ((select private.can_manage_checkout_settings()));

-- Attribute settings changes to the authenticated caller, never a supplied UUID.
create or replace function private.attribute_checkout_settings_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_by := (select auth.uid());
  return new;
end;
$$;
alter function private.attribute_checkout_settings_change() owner to postgres;
revoke all on function private.attribute_checkout_settings_change() from public, anon, authenticated;
create trigger checkout_settings_attribute_change before update on public.checkout_settings
for each row execute function private.attribute_checkout_settings_change();

create or replace function private.audit_checkout_settings_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text;
begin
  if row(new.paystack_enabled,new.whatsapp_enabled) is not distinct from row(old.paystack_enabled,old.whatsapp_enabled) then return new; end if;
  select email into actor_email from public.admin_users where id=actor_id and is_active and role in ('owner','admin');
  if actor_email is null then return new; end if;
  insert into public.admin_audit_log(admin_user_id,admin_email_snapshot,action,entity_type,entity_id,previous_values,new_values)
  values(actor_id,actor_email,'checkout_settings_updated','checkout_settings',null,
    jsonb_build_object('paystack_enabled',old.paystack_enabled,'whatsapp_enabled',old.whatsapp_enabled),
    jsonb_build_object('paystack_enabled',new.paystack_enabled,'whatsapp_enabled',new.whatsapp_enabled));
  return new;
end;
$$;
alter function private.audit_checkout_settings_change() owner to postgres;
revoke all on function private.audit_checkout_settings_change() from public, anon, authenticated;
create trigger checkout_settings_write_audit after update on public.checkout_settings
for each row execute function private.audit_checkout_settings_change();
