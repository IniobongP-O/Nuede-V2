begin;

create extension if not exists pgtap with schema extensions;

select plan(36);

select is((select count(*)::integer from storage.buckets where id = 'product-images'), 1, 'product image bucket exists');
select ok((select public from storage.buckets where id = 'product-images'), 'product image bucket supports public reads');
select is((select file_size_limit from storage.buckets where id = 'product-images'), 5242880::bigint, 'bucket enforces the five MB limit');
select ok((select 'image/webp' = any(allowed_mime_types) from storage.buckets where id = 'product-images'), 'bucket allows optimized WebP images');
select ok(exists(select 1 from pg_policies where schemaname = 'storage' and policyname = 'product_images_public_select'), 'public image read policy exists');
select ok(exists(select 1 from pg_policies where schemaname = 'storage' and policyname = 'product_images_active_admin_insert'), 'admin image insert policy exists');
select ok(exists(select 1 from pg_policies where schemaname = 'storage' and policyname = 'product_images_active_admin_update'), 'admin image update policy exists');
select ok(exists(select 1 from pg_policies where schemaname = 'storage' and policyname = 'product_images_active_admin_delete'), 'admin image delete policy exists');

select has_function('private', 'validate_grouped_product_orderability', array[]::text[], 'group orderability function exists');
select has_function('private', 'protect_grouped_variant_transition', array[]::text[], 'variant transition guard exists');
select has_function('public', 'reorder_product_variants', array['uuid', 'uuid[]'], 'atomic variant reorder function exists');
select has_function('public', 'replace_product_addon_assignments', array['uuid', 'uuid[]'], 'atomic add-on assignment function exists');
select has_trigger('public', 'products', 'products_validate_grouped_orderability', 'group parents have an orderability trigger');
select has_trigger('public', 'product_variants', 'product_variants_protect_grouped_transition', 'variants protect parent orderability');
select has_trigger('public', 'product_variants', 'product_variants_write_audit', 'variant writes are audited');
select has_trigger('public', 'product_addons', 'product_addons_write_audit', 'add-on writes are audited');
select has_trigger('public', 'product_addon_assignments', 'product_addon_assignments_write_audit', 'add-on relationships are audited');
select ok(not has_function_privilege('anon', 'public.reorder_product_variants(uuid,uuid[])', 'EXECUTE'), 'anonymous users cannot call variant reorder');
select ok(has_function_privilege('authenticated', 'public.reorder_product_variants(uuid,uuid[])', 'EXECUTE'), 'authenticated admins have the reorder grant needed by RLS');
select ok(not has_function_privilege('anon', 'public.replace_product_addon_assignments(uuid,uuid[])', 'EXECUTE'), 'anonymous users cannot replace add-on assignments');
select ok(has_function_privilege('authenticated', 'public.replace_product_addon_assignments(uuid,uuid[])', 'EXECUTE'), 'authenticated admins have the assignment grant needed by RLS');
select ok(not has_function_privilege('authenticated', 'private.protect_grouped_variant_transition()', 'EXECUTE'), 'variant trigger guard is not a browser RPC');

insert into public.products (
  id, category_id, product_type, name, slug, status, requires_variant_selection
) values (
  '71000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000003',
  'grouped', 'Cycle 5 Test Group', 'cycle-5-test-group', 'hidden', true
);

select throws_ok(
  $$update public.products set status = 'available' where id = '71000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'group with zero variants cannot become available'
);

select lives_ok(
  $$insert into public.product_variants (id, product_id, name, status, sort_order)
    values ('72000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001', 'Hidden variant', 'hidden', 10)$$,
  'hidden variant can be created while a group is not orderable'
);

select throws_ok(
  $$update public.products set status = 'available' where id = '71000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'group with only hidden variants cannot become available'
);

select lives_ok(
  $$insert into public.product_variants (id, product_id, name, price_kobo, status, sort_order)
    values ('72000000-0000-4000-8000-000000000002', '71000000-0000-4000-8000-000000000001', 'Sold-out variant', 500000, 'sold_out', 20)$$,
  'sold-out variant can be stored independently'
);

select throws_ok(
  $$update public.products set status = 'available' where id = '71000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'group with only hidden and sold-out variants cannot become available'
);

select lives_ok(
  $$insert into public.product_variants (id, product_id, name, price_kobo, status, sort_order)
    values ('72000000-0000-4000-8000-000000000003', '71000000-0000-4000-8000-000000000001', 'Available variant', 650000, 'available', 30)$$,
  'available priced variant can be created'
);

select lives_ok(
  $$update public.products set status = 'available' where id = '71000000-0000-4000-8000-000000000001'$$,
  'group with an orderable variant can become available'
);

select throws_ok(
  $$update public.product_variants set status = 'hidden' where id = '72000000-0000-4000-8000-000000000003'$$,
  '23514', null, 'final orderable variant cannot be hidden while its group is available'
);

select lives_ok(
  $$update public.products set requires_variant_selection = false, default_variant_id = '72000000-0000-4000-8000-000000000003'
    where id = '71000000-0000-4000-8000-000000000001'$$,
  'available child can become the configured default'
);

select throws_ok(
  $$update public.product_variants set status = 'sold_out' where id = '72000000-0000-4000-8000-000000000003'$$,
  '23514', null, 'configured default cannot become sold out'
);

select throws_ok(
  $$delete from public.product_variants where id = '72000000-0000-4000-8000-000000000003'$$,
  '23514', null, 'configured default cannot be removed'
);

insert into public.products (
  id, category_id, product_type, name, slug, status, requires_variant_selection
) values (
  '71000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  'grouped', 'Other Cycle 5 Group', 'other-cycle-5-group', 'hidden', true
);

select throws_ok(
  $$update public.product_variants set product_id = '71000000-0000-4000-8000-000000000002'
    where id = '72000000-0000-4000-8000-000000000003'$$,
  '23514', null, 'stable variant cannot move to another group'
);

select lives_ok(
  $$update public.products set status = 'hidden', requires_variant_selection = true, default_variant_id = null
    where id = '71000000-0000-4000-8000-000000000001';
    update public.product_variants set status = 'hidden' where id = '72000000-0000-4000-8000-000000000003'$$,
  'last orderable variant can be hidden after the parent is no longer orderable'
);

set local role anon;

select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('product-images', 'products/71000000-0000-4000-8000-000000000001/anonymous.webp', '{}'::jsonb)$$,
  '42501', null, 'anonymous product-image upload is rejected'
);

reset role;

select * from finish();

rollback;
