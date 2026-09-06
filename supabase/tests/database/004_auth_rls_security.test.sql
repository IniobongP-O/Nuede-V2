begin;

create extension if not exists pgtap with schema extensions;

select plan(34);

select is(
  (
    select count(*)::integer
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relkind = 'r'
      and relrowsecurity
  ),
  15,
  'RLS is enabled on all fifteen Cycle 2 business tables'
);

select is(
  (select count(*)::integer from pg_policies where schemaname = 'public'),
  45,
  'the approved operation-specific RLS policy set exists'
);

select has_schema('private', 'private helper schema exists');
select has_function('private', 'is_active_admin', array[]::text[], 'active-admin helper exists');
select ok(
  (select prosecdef from pg_proc where oid = 'private.is_active_admin()'::regprocedure),
  'active-admin helper is security definer'
);
select is(
  (
    select pg_get_userbyid(proowner)
    from pg_proc
    where oid = 'private.is_active_admin()'::regprocedure
  ),
  'postgres',
  'active-admin helper has the reviewed owner'
);
select ok(
  (
    select array_to_string(proconfig, ',') like '%search_path=%'
    from pg_proc
    where oid = 'private.is_active_admin()'::regprocedure
  ),
  'active-admin helper pins an empty search path'
);
select ok(has_schema_privilege('authenticated', 'private', 'USAGE'), 'authenticated can resolve the policy helper');
select ok(not has_schema_privilege('anon', 'private', 'USAGE'), 'anon cannot resolve the private helper schema');
select ok(has_function_privilege('authenticated', 'private.is_active_admin()', 'EXECUTE'), 'authenticated can execute its authorization helper');
select ok(not has_function_privilege('anon', 'private.is_active_admin()', 'EXECUTE'), 'anon cannot execute the authorization helper');
select ok(not has_function_privilege('anon', 'public.set_updated_at()', 'EXECUTE'), 'trigger helpers are not anonymous RPCs');

select has_view('public', 'checkout_payment_options', 'safe checkout payment-options view exists');
select is(
  (
    select array_agg(column_name order by ordinal_position)::text[]
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'checkout_payment_options'
  ),
  array['paystack_enabled', 'whatsapp_enabled']::text[],
  'checkout view exposes only payment availability flags'
);
select ok(has_table_privilege('anon', 'public.checkout_payment_options', 'SELECT'), 'anon can read the safe checkout view');
select ok(not has_table_privilege('anon', 'public.checkout_settings', 'SELECT'), 'anon cannot read checkout metadata from the base table');
select ok(has_column_privilege('anon', 'public.feedback', 'message', 'INSERT'), 'anon can submit feedback through allowed columns');
select ok(not has_table_privilege('anon', 'public.feedback', 'SELECT'), 'anon cannot read private feedback');
select ok(has_table_privilege('anon', 'public.products', 'SELECT'), 'anon can request public products');
select ok(not has_table_privilege('anon', 'public.products', 'UPDATE'), 'anon cannot mutate product prices');
select ok(has_table_privilege('authenticated', 'public.orders', 'SELECT'), 'authenticated role has the grant needed for active-admin order reads');
select ok(not has_table_privilege('authenticated', 'public.orders', 'INSERT'), 'authenticated clients cannot create authoritative orders');
select ok(has_table_privilege('authenticated', 'public.products', 'UPDATE'), 'authenticated role has the grant needed for active-admin catalog updates');
select ok(not has_table_privilege('authenticated', 'public.checkout_settings', 'UPDATE'), 'authenticated clients cannot mutate checkout settings');
select ok(has_table_privilege('service_role', 'public.orders', 'INSERT'), 'trusted backend retains authoritative order access');

set local role anon;

select is((select count(*)::integer from public.categories), 3, 'anon sees enabled categories');
select is((select count(*)::integer from public.products), 40, 'anon sees the public fixtures and imported menu, but not hidden products');
select is((select count(*)::integer from public.product_variants), 2, 'anon sees only public variants with public parents');
select is((select count(*)::integer from public.product_addons), 3, 'anon sees only available add-ons');
select is((select count(*)::integer from public.product_addon_assignments), 3, 'anon sees only public add-on assignments');
select is((select count(*)::integer from public.delivery_zones), 6, 'anon sees only active delivery zones');
select is((select count(*)::integer from public.published_testimonials), 2, 'anon sees only published testimonials');
select ok(
  (select paystack_enabled and whatsapp_enabled from public.checkout_payment_options),
  'anon can read safe checkout payment availability'
);
select lives_ok(
  $$
    insert into public.feedback (customer_name, email, subject, rating, message)
    values ('RLS Test', 'rls-test@example.com', 'general_inquiry', 5, 'Anonymous feedback insert is permitted.')
  $$,
  'anonymous feedback submission succeeds'
);

reset role;

select * from finish();

rollback;
