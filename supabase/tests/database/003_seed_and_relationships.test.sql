begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

select is((select count(*)::integer from public.categories), 3, 'three categories are seeded');
select is((select count(*)::integer from public.products), 41, 'eight fixtures and thirty-three menu products are seeded');
select is(
  (select count(*)::integer from public.products where product_type = 'grouped'),
  1,
  'one grouped product is seeded'
);
select is((select count(*)::integer from public.product_variants), 3, 'three variants are seeded');
select is((select count(*)::integer from public.product_addons), 4, 'four add-ons are seeded');
select is(
  (
    select count(*)::integer
    from public.product_addon_assignments
    where product_id = '20000000-0000-4000-8000-000000000008'
  ),
  4,
  'grouped product has four shared add-ons'
);
select is((select count(*)::integer from public.delivery_zones), 7, 'seven delivery zones are seeded');
select is((select count(*)::integer from public.testimonials), 3, 'three testimonials are seeded');
select ok(
  (select paystack_enabled and whatsapp_enabled from public.checkout_settings where id),
  'both checkout methods start enabled'
);
select ok(
  exists (
    select 1
    from public.products as product
    join public.product_variants as variant
      on variant.id = product.default_variant_id
     and variant.product_id = product.id
    where product.id = '20000000-0000-4000-8000-000000000008'
  ),
  'the grouped default variant belongs to its parent'
);
select is((select count(*)::integer from public.admin_users), 0, 'no fake admin identity is seeded');
select is((select count(*)::integer from public.orders), 0, 'no test orders are seeded');
select is((select count(*)::integer from public.payments), 0, 'no test payments are seeded');

select * from finish();

rollback;
