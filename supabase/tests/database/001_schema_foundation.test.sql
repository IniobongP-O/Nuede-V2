begin;

create extension if not exists pgtap with schema extensions;

select plan(29);

select has_table('public', 'categories', 'categories table exists');
select has_table('public', 'products', 'products table exists');
select has_table('public', 'product_variants', 'product_variants table exists');
select has_table('public', 'product_addons', 'product_addons table exists');
select has_table('public', 'product_addon_assignments', 'product_addon_assignments table exists');
select has_table('public', 'delivery_zones', 'delivery_zones table exists');
select has_table('public', 'checkout_settings', 'checkout_settings table exists');
select has_table('public', 'admin_users', 'admin_users table exists');
select has_table('public', 'orders', 'orders table exists');
select has_table('public', 'order_items', 'order_items table exists');
select has_table('public', 'order_item_addons', 'order_item_addons table exists');
select has_table('public', 'payments', 'payments table exists');
select has_table('public', 'testimonials', 'testimonials table exists');
select has_table('public', 'feedback', 'feedback table exists');
select has_table('public', 'admin_audit_log', 'admin_audit_log table exists');
select has_table('public', 'product_addon_assignments', 'add-on compatibility is relational');

select col_type_is('public', 'products', 'price_kobo', 'bigint', 'product money uses bigint kobo');
select col_type_is('public', 'delivery_zones', 'fee_kobo', 'bigint', 'delivery money uses bigint kobo');
select col_type_is('public', 'orders', 'total_kobo', 'bigint', 'order money uses bigint kobo');
select col_type_is('public', 'payments', 'amount_kobo', 'bigint', 'payment money uses bigint kobo');

select has_constraint(
  'public',
  'products',
  'products_status_allowed',
  'products have a constrained state model'
);
select has_constraint(
  'public',
  'checkout_settings',
  'checkout_settings_payment_method_required',
  'checkout settings preserve one enabled method'
);
select has_constraint(
  'public',
  'orders',
  'orders_total_integrity',
  'order total integrity is constrained'
);
select has_constraint(
  'public',
  'admin_users',
  'admin_users_auth_user_fk',
  'admin users reference Supabase Auth identities'
);

select has_index(
  'public',
  'products',
  'products_storefront_category_sort_idx',
  'storefront product index exists'
);
select has_index(
  'public',
  'orders',
  'orders_payment_status_created_idx',
  'payment-status order index exists'
);
select has_index(
  'public',
  'payments',
  'payments_provider_reference_unique_idx',
  'provider references are idempotent'
);
select has_index(
  'public',
  'testimonials',
  'testimonials_published_idx',
  'published testimonial index exists'
);

select is(
  (
    select count(*)::integer
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relkind = 'r'
      and relrowsecurity
  ),
  0,
  'Cycle 2 does not enable RLS before Cycle 3'
);

select * from finish();

rollback;
