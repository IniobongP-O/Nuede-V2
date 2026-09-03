-- Cycle 11: scoped admin configuration for the checkout-settings singleton.
grant update (paystack_enabled, whatsapp_enabled, updated_by)
on table public.checkout_settings to authenticated;

create policy checkout_settings_active_admin_update
on public.checkout_settings
for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'delivery_zones'
  ) then
    alter publication supabase_realtime add table public.delivery_zones;
  end if;
end;
$$;

comment on policy checkout_settings_active_admin_update on public.checkout_settings is
  'Cycle 11 permits only active Nuede admins to update the checkout singleton; the database retains the final-method invariant.';
