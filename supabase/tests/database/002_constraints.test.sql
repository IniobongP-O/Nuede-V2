begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

insert into public.orders (
  id,
  order_reference,
  order_type,
  customer_name,
  customer_phone,
  delivery_address,
  delivery_zone_name,
  payment_method,
  payment_status,
  fulfilment_status,
  subtotal_kobo,
  delivery_fee_kobo,
  total_kobo,
  nutrition_completeness
)
values (
  '70000000-0000-4000-8000-000000000001',
  'NUE-CONSTRAINT-TEST',
  'cart',
  'Constraint Test Customer',
  '+2340000000000',
  'Local database test address',
  'Local Test Zone',
  'whatsapp',
  'unpaid',
  'pending',
  100000,
  0,
  100000,
  'unavailable'
);

select throws_ok(
  $$
    insert into public.products (
      category_id, product_type, name, slug, price_kobo, status
    ) values (
      '10000000-0000-4000-8000-000000000001',
      'standard',
      'Negative Product',
      'negative-product',
      -1,
      'hidden'
    )
  $$,
  '23514',
  null,
  'negative product price is rejected'
);

select throws_ok(
  $$
    insert into public.product_variants (
      product_id, name, price_kobo, status
    ) values (
      '20000000-0000-4000-8000-000000000008',
      'Negative Variant',
      -1,
      'hidden'
    )
  $$,
  '23514',
  null,
  'negative variant price is rejected'
);

select throws_ok(
  $$insert into public.product_addons (name, price_kobo) values ('Negative Add-on', -1)$$,
  '23514',
  null,
  'negative add-on price is rejected'
);

select throws_ok(
  $$
    insert into public.feedback (customer_name, email, subject, rating, message)
    values ('Constraint Test', 'test@example.invalid', 'Other', 6, 'Invalid rating')
  $$,
  '23514',
  null,
  'rating outside one to five is rejected'
);

select throws_ok(
  $$update public.checkout_settings set paystack_enabled = false, whatsapp_enabled = false$$,
  '23514',
  null,
  'both checkout methods cannot be disabled'
);

select throws_ok(
  $$delete from public.checkout_settings$$,
  '23514',
  null,
  'checkout settings singleton cannot be deleted'
);

select throws_ok(
  $$
    insert into public.product_addon_assignments (product_id, addon_id)
    values (
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      '40000000-0000-4000-8000-000000000001'
    )
  $$,
  '23503',
  null,
  'invalid product relationship is rejected'
);

select throws_ok(
  $$
    insert into public.products (
      category_id, product_type, name, slug, price_kobo, calories, status
    ) values (
      '10000000-0000-4000-8000-000000000001',
      'standard',
      'Negative Nutrition',
      'negative-nutrition',
      100000,
      -1,
      'hidden'
    )
  $$,
  '23514',
  null,
  'negative nutrition is rejected'
);

select throws_ok(
  $$
    insert into public.order_items (
      order_id, product_name, unit_base_price_kobo, quantity, line_total_kobo
    ) values (
      '70000000-0000-4000-8000-000000000001',
      'Quantity Test',
      100000,
      0,
      0
    )
  $$,
  '23514',
  null,
  'zero order-item quantity is rejected'
);

select throws_ok(
  $$
    insert into public.admin_users (id, email, role)
    values ('70000000-0000-4000-8000-000000000002', 'invalid-role@example.invalid', 'superuser')
  $$,
  '23514',
  null,
  'invalid admin role is rejected'
);

select throws_ok(
  $$
    insert into public.product_variants (product_id, name, price_kobo, status)
    values (
      '20000000-0000-4000-8000-000000000001',
      'Variant Under Standard Product',
      100000,
      'available'
    )
  $$,
  '23514',
  null,
  'variants under standard products are rejected'
);

insert into public.products (
  id,
  category_id,
  product_type,
  name,
  slug,
  status,
  requires_variant_selection
)
values (
  '70000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000003',
  'grouped',
  'Second Test Group',
  'second-test-group',
  'hidden',
  true
);

select throws_ok(
  $$
    update public.products
    set
      requires_variant_selection = false,
      default_variant_id = '30000000-0000-4000-8000-000000000001'
    where id = '70000000-0000-4000-8000-000000000003'
  $$,
  '23514',
  null,
  'default variant from another product is rejected'
);

select lives_ok(
  $$
    insert into public.products (
      category_id,
      product_type,
      name,
      slug,
      price_kobo,
      calories,
      status
    ) values (
      '10000000-0000-4000-8000-000000000001',
      'standard',
      'Partial Nutrition Test',
      'partial-nutrition-test',
      100000,
      250,
      'hidden'
    )
  $$,
  'partial nutrition is accepted without false zero values'
);

select * from finish();

rollback;
