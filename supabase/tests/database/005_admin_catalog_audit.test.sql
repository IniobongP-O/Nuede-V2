begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

select has_function('private', 'audit_product_change', array[]::text[], 'catalog audit trigger function exists');
select ok(
  (select prosecdef from pg_proc where oid = 'private.audit_product_change()'::regprocedure),
  'catalog audit function is security definer'
);
select is(
  (select pg_get_userbyid(proowner) from pg_proc where oid = 'private.audit_product_change()'::regprocedure),
  'postgres',
  'catalog audit function has the reviewed owner'
);
select ok(
  (select array_to_string(proconfig, ',') like '%search_path=%' from pg_proc where oid = 'private.audit_product_change()'::regprocedure),
  'catalog audit function pins an empty search path'
);
select ok(not has_function_privilege('anon', 'private.audit_product_change()', 'EXECUTE'), 'anon cannot invoke the audit function');
select ok(not has_function_privilege('authenticated', 'private.audit_product_change()', 'EXECUTE'), 'authenticated clients cannot invoke the audit function directly');
select has_trigger('public', 'products', 'products_write_audit', 'products have the Cycle 4 audit trigger');
select ok(not has_table_privilege('authenticated', 'public.admin_audit_log', 'INSERT'), 'authenticated clients cannot forge audit rows');
select like(
  pg_get_functiondef('private.audit_product_change()'::regprocedure),
  '%product_created%product_price_changed%product_archived%product_restored%',
  'the product audit function records the required Cycle 4 event classes'
);

select * from finish();

rollback;
