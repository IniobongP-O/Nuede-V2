-- Nuede V2 Cycle 3: Supabase Auth authorization, RLS, and least-privilege grants.
-- Frontend route guards improve UX; these database controls are the security boundary.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users as admin_user
    where admin_user.id = (select auth.uid())
      and admin_user.is_active
      and admin_user.role in ('owner', 'admin', 'editor')
  );
$$;

alter function private.is_active_admin() owner to postgres;

comment on function private.is_active_admin() is
  'Returns whether the authenticated caller has an active, recognized Nuede admin record. Kept outside exposed API schemas.';

revoke all on function private.is_active_admin() from public, anon, authenticated;
grant execute on function private.is_active_admin() to authenticated;

-- Cycle 2 trigger functions are internal implementation details, not public RPCs.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.validate_product_default_variant() from public, anon, authenticated;
revoke all on function public.validate_grouped_product_variant() from public, anon, authenticated;
revoke all on function public.prevent_checkout_settings_delete() from public, anon, authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_addons enable row level security;
alter table public.product_addon_assignments enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.admin_users enable row level security;
alter table public.checkout_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_addons enable row level security;
alter table public.payments enable row level security;
alter table public.feedback enable row level security;
alter table public.testimonials enable row level security;
alter table public.admin_audit_log enable row level security;

-- Replace project-dependent default privileges with a version-controlled ACL.
revoke all privileges on table
  public.categories,
  public.products,
  public.product_variants,
  public.product_addons,
  public.product_addon_assignments,
  public.delivery_zones,
  public.admin_users,
  public.checkout_settings,
  public.orders,
  public.order_items,
  public.order_item_addons,
  public.payments,
  public.feedback,
  public.testimonials,
  public.admin_audit_log
from public, anon, authenticated;

grant all privileges on table
  public.categories,
  public.products,
  public.product_variants,
  public.product_addons,
  public.product_addon_assignments,
  public.delivery_zones,
  public.admin_users,
  public.checkout_settings,
  public.orders,
  public.order_items,
  public.order_item_addons,
  public.payments,
  public.feedback,
  public.testimonials,
  public.admin_audit_log
to service_role;

-- Public storefront reads. Authenticated callers retain the same public subset.
grant select on table
  public.categories,
  public.products,
  public.product_variants,
  public.product_addons,
  public.product_addon_assignments,
  public.delivery_zones,
  public.testimonials
to anon, authenticated;

create policy categories_public_select
on public.categories
for select
to anon, authenticated
using (is_enabled);

create policy products_public_select
on public.products
for select
to anon, authenticated
using (status not in ('hidden', 'archived'));

create policy product_variants_public_select
on public.product_variants
for select
to anon, authenticated
using (
  status <> 'hidden'
  and exists (
    select 1
    from public.products as parent_product
    where parent_product.id = product_variants.product_id
      and parent_product.status not in ('hidden', 'archived')
  )
);

create policy product_addons_public_select
on public.product_addons
for select
to anon, authenticated
using (is_available);

create policy product_addon_assignments_public_select
on public.product_addon_assignments
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products as assigned_product
    where assigned_product.id = product_addon_assignments.product_id
      and assigned_product.status not in ('hidden', 'archived')
  )
  and exists (
    select 1
    from public.product_addons as assigned_addon
    where assigned_addon.id = product_addon_assignments.addon_id
      and assigned_addon.is_available
  )
);

create policy delivery_zones_public_select
on public.delivery_zones
for select
to anon, authenticated
using (is_active);

create policy testimonials_public_select
on public.testimonials
for select
to anon, authenticated
using (is_published);

-- Active admins may manage content/configuration tables used by documented admin features.
grant insert, update, delete on table
  public.categories,
  public.products,
  public.product_variants,
  public.product_addons,
  public.product_addon_assignments,
  public.delivery_zones,
  public.testimonials
to authenticated;

create policy categories_active_admin_select on public.categories
for select to authenticated using ((select private.is_active_admin()));
create policy categories_active_admin_insert on public.categories
for insert to authenticated with check ((select private.is_active_admin()));
create policy categories_active_admin_update on public.categories
for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy categories_active_admin_delete on public.categories
for delete to authenticated using ((select private.is_active_admin()));

create policy products_active_admin_select on public.products
for select to authenticated using ((select private.is_active_admin()));
create policy products_active_admin_insert on public.products
for insert to authenticated with check ((select private.is_active_admin()));
create policy products_active_admin_update on public.products
for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy products_active_admin_delete on public.products
for delete to authenticated using ((select private.is_active_admin()));

create policy product_variants_active_admin_select on public.product_variants
for select to authenticated using ((select private.is_active_admin()));
create policy product_variants_active_admin_insert on public.product_variants
for insert to authenticated with check ((select private.is_active_admin()));
create policy product_variants_active_admin_update on public.product_variants
for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy product_variants_active_admin_delete on public.product_variants
for delete to authenticated using ((select private.is_active_admin()));

create policy product_addons_active_admin_select on public.product_addons
for select to authenticated using ((select private.is_active_admin()));
create policy product_addons_active_admin_insert on public.product_addons
for insert to authenticated with check ((select private.is_active_admin()));
create policy product_addons_active_admin_update on public.product_addons
for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy product_addons_active_admin_delete on public.product_addons
for delete to authenticated using ((select private.is_active_admin()));

create policy product_addon_assignments_active_admin_select on public.product_addon_assignments
for select to authenticated using ((select private.is_active_admin()));
create policy product_addon_assignments_active_admin_insert on public.product_addon_assignments
for insert to authenticated with check ((select private.is_active_admin()));
create policy product_addon_assignments_active_admin_update on public.product_addon_assignments
for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy product_addon_assignments_active_admin_delete on public.product_addon_assignments
for delete to authenticated using ((select private.is_active_admin()));

create policy delivery_zones_active_admin_select on public.delivery_zones
for select to authenticated using ((select private.is_active_admin()));
create policy delivery_zones_active_admin_insert on public.delivery_zones
for insert to authenticated with check ((select private.is_active_admin()));
create policy delivery_zones_active_admin_update on public.delivery_zones
for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy delivery_zones_active_admin_delete on public.delivery_zones
for delete to authenticated using ((select private.is_active_admin()));

create policy testimonials_active_admin_select on public.testimonials
for select to authenticated using ((select private.is_active_admin()));
create policy testimonials_active_admin_insert on public.testimonials
for insert to authenticated with check ((select private.is_active_admin()));
create policy testimonials_active_admin_update on public.testimonials
for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy testimonials_active_admin_delete on public.testimonials
for delete to authenticated using ((select private.is_active_admin()));

-- An authenticated identity may inspect only its own Nuede authorization row.
grant select on table public.admin_users to authenticated;

create policy admin_users_select_own
on public.admin_users
for select
to authenticated
using (id = (select auth.uid()));

-- Private operational data is readable only by active admins. Trusted writes arrive later.
grant select on table
  public.checkout_settings,
  public.orders,
  public.order_items,
  public.order_item_addons,
  public.payments,
  public.feedback,
  public.admin_audit_log
to authenticated;

create policy checkout_settings_active_admin_select on public.checkout_settings
for select to authenticated using ((select private.is_active_admin()));
create policy orders_active_admin_select on public.orders
for select to authenticated using ((select private.is_active_admin()));
create policy order_items_active_admin_select on public.order_items
for select to authenticated using ((select private.is_active_admin()));
create policy order_item_addons_active_admin_select on public.order_item_addons
for select to authenticated using ((select private.is_active_admin()));
create policy payments_active_admin_select on public.payments
for select to authenticated using ((select private.is_active_admin()));
create policy feedback_active_admin_select on public.feedback
for select to authenticated using ((select private.is_active_admin()));
create policy admin_audit_log_active_admin_select on public.admin_audit_log
for select to authenticated using ((select private.is_active_admin()));

-- The only anonymous write is customer feedback submission.
grant insert on table public.feedback to anon;

create policy feedback_public_insert
on public.feedback
for insert
to anon
with check (true);

-- Deliberately privileged projection: only safe payment-option booleans cross this boundary.
create view public.checkout_payment_options
with (security_barrier = true)
as
select paystack_enabled, whatsapp_enabled
from public.checkout_settings
where id;

alter view public.checkout_payment_options owner to postgres;

comment on view public.checkout_payment_options is
  'Public checkout contract exposing payment availability only; admin metadata remains private.';

revoke all privileges on table public.checkout_payment_options from public, anon, authenticated;
grant select on table public.checkout_payment_options to anon, authenticated, service_role;
