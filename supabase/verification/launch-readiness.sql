-- Read-only operational checks; run after migrations with a privileged connection.
-- Counts/configuration only; deliberately no customer rows or credential values.
begin read only;
select version from supabase_migrations.schema_migrations order by version;
select c.relname as business_table, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' order by c.relname;
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname in ('public','storage') order by tablename,policyname;
select conname, convalidated from pg_constraint
where conrelid in ('public.orders'::regclass,'public.payments'::regclass,'public.checkout_settings'::regclass,'public.feedback'::regclass,'public.testimonials'::regclass)
order by conname;
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id='product-images';
select count(*) as active_owners from public.admin_users where role='owner' and is_active;
select count(*) as available_products from public.products where status='available';
select count(*) as active_delivery_zones from public.delivery_zones where is_active;
select paystack_enabled,whatsapp_enabled from public.checkout_settings where id;
select count(*) as published_stories from public.published_testimonials;
select has_table_privilege('anon','public.feedback','SELECT') as public_feedback_read,
  has_table_privilege('anon','public.testimonials','SELECT') as public_testimonial_metadata_read,
  has_function_privilege('anon','public.reconcile_paystack_payment_atomic(text,text,bigint,text,text,timestamp with time zone)','EXECUTE') as public_payment_mutation;
select count(*) as eligible_paid_orders,coalesce(sum(revenue_kobo),0) as verified_revenue_kobo
from private.analytics_eligible_sales;
rollback;
