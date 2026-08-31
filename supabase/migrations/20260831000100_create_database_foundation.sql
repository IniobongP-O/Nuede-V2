-- Nuede V2 Cycle 2: Supabase PostgreSQL database foundation.
-- RLS, authorization policies, storage buckets, Edge Functions, and commerce
-- workflows intentionally belong to later cycles.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Maintains updated_at on mutable Cycle 2 business records.';

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank check (btrim(name) <> ''),
  constraint categories_name_unique unique (name),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint categories_slug_unique unique (slug),
  constraint categories_sort_order_nonnegative check (sort_order >= 0)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null,
  product_type text not null,
  name text not null,
  slug text not null,
  description text not null default '',
  price_kobo bigint,
  calories integer,
  protein_g numeric(8, 2),
  carbohydrates_g numeric(8, 2),
  fat_g numeric(8, 2),
  image_path text,
  status text not null default 'hidden',
  requires_variant_selection boolean not null default false,
  default_variant_id uuid,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_category_fk
    foreign key (category_id) references public.categories(id) on delete restrict,
  constraint products_type_allowed
    check (product_type in ('standard', 'grouped')),
  constraint products_name_not_blank check (btrim(name) <> ''),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint products_slug_unique unique (slug),
  constraint products_price_nonnegative check (price_kobo is null or price_kobo >= 0),
  constraint products_calories_nonnegative check (calories is null or calories >= 0),
  constraint products_protein_nonnegative check (protein_g is null or protein_g >= 0),
  constraint products_carbohydrates_nonnegative
    check (carbohydrates_g is null or carbohydrates_g >= 0),
  constraint products_fat_nonnegative check (fat_g is null or fat_g >= 0),
  constraint products_image_path_not_blank
    check (image_path is null or btrim(image_path) <> ''),
  constraint products_status_allowed
    check (status in ('available', 'sold_out', 'hidden', 'archived', 'price_pending', 'unavailable')),
  constraint products_sort_order_nonnegative check (sort_order >= 0),
  constraint products_price_state_integrity check (
    (product_type = 'grouped' and price_kobo is null)
    or
    (
      product_type = 'standard'
      and (
        (status in ('available', 'sold_out') and price_kobo is not null)
        or (status = 'price_pending' and price_kobo is null)
        or status in ('hidden', 'archived', 'unavailable')
      )
    )
  ),
  constraint products_variant_selection_integrity check (
    (
      product_type = 'standard'
      and requires_variant_selection = false
      and default_variant_id is null
    )
    or
    (
      product_type = 'grouped'
      and (
        (requires_variant_selection = true and default_variant_id is null)
        or
        (requires_variant_selection = false and default_variant_id is not null)
      )
    )
  )
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  name text not null,
  description text not null default '',
  price_kobo bigint,
  calories integer,
  protein_g numeric(8, 2),
  carbohydrates_g numeric(8, 2),
  fat_g numeric(8, 2),
  image_path text,
  status text not null default 'hidden',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_product_fk
    foreign key (product_id) references public.products(id) on delete cascade,
  constraint product_variants_product_id_id_unique unique (product_id, id),
  constraint product_variants_name_not_blank check (btrim(name) <> ''),
  constraint product_variants_price_nonnegative check (price_kobo is null or price_kobo >= 0),
  constraint product_variants_calories_nonnegative check (calories is null or calories >= 0),
  constraint product_variants_protein_nonnegative check (protein_g is null or protein_g >= 0),
  constraint product_variants_carbohydrates_nonnegative
    check (carbohydrates_g is null or carbohydrates_g >= 0),
  constraint product_variants_fat_nonnegative check (fat_g is null or fat_g >= 0),
  constraint product_variants_image_path_not_blank
    check (image_path is null or btrim(image_path) <> ''),
  constraint product_variants_status_allowed
    check (status in ('available', 'sold_out', 'hidden', 'unavailable')),
  constraint product_variants_orderable_price_required
    check (status not in ('available', 'sold_out') or price_kobo is not null),
  constraint product_variants_sort_order_nonnegative check (sort_order >= 0)
);

alter table public.products
  add constraint products_default_variant_fk
  foreign key (default_variant_id)
  references public.product_variants(id)
  on delete restrict
  deferrable initially immediate;

create or replace function public.validate_product_default_variant()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.default_variant_id is not null and not exists (
    select 1
    from public.product_variants as variant
    where variant.id = new.default_variant_id
      and variant.product_id = new.id
  ) then
    raise exception using
      errcode = '23514',
      constraint = 'products_default_variant_belongs_to_product',
      message = 'A default variant must belong to its grouped product.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_grouped_product_variant()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_type text;
begin
  select product_type
    into parent_type
  from public.products
  where id = new.product_id;

  if parent_type is distinct from 'grouped' then
    raise exception using
      errcode = '23514',
      constraint = 'product_variants_grouped_parent_required',
      message = 'Product variants can only belong to grouped products.';
  end if;

  return new;
end;
$$;

create trigger products_validate_default_variant
before insert or update of id, default_variant_id on public.products
for each row execute function public.validate_product_default_variant();

create trigger product_variants_validate_grouped_parent
before insert or update of product_id on public.product_variants
for each row execute function public.validate_grouped_product_variant();

create table public.product_addons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_kobo bigint not null,
  calories integer,
  protein_g numeric(8, 2),
  carbohydrates_g numeric(8, 2),
  fat_g numeric(8, 2),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_addons_name_not_blank check (btrim(name) <> ''),
  constraint product_addons_name_unique unique (name),
  constraint product_addons_price_nonnegative check (price_kobo >= 0),
  constraint product_addons_calories_nonnegative check (calories is null or calories >= 0),
  constraint product_addons_protein_nonnegative check (protein_g is null or protein_g >= 0),
  constraint product_addons_carbohydrates_nonnegative
    check (carbohydrates_g is null or carbohydrates_g >= 0),
  constraint product_addons_fat_nonnegative check (fat_g is null or fat_g >= 0)
);

create table public.product_addon_assignments (
  product_id uuid not null,
  addon_id uuid not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (product_id, addon_id),
  constraint product_addon_assignments_product_fk
    foreign key (product_id) references public.products(id) on delete cascade,
  constraint product_addon_assignments_addon_fk
    foreign key (addon_id) references public.product_addons(id) on delete cascade,
  constraint product_addon_assignments_sort_order_nonnegative check (sort_order >= 0)
);

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  fee_kobo bigint not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_zones_name_not_blank check (btrim(name) <> ''),
  constraint delivery_zones_name_unique unique (name),
  constraint delivery_zones_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint delivery_zones_slug_unique unique (slug),
  constraint delivery_zones_fee_nonnegative check (fee_kobo >= 0),
  constraint delivery_zones_sort_order_nonnegative check (sort_order >= 0)
);

create table public.admin_users (
  id uuid primary key,
  email text not null,
  display_name text,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_auth_user_fk
    foreign key (id) references auth.users(id) on delete cascade,
  constraint admin_users_email_not_blank check (btrim(email) <> ''),
  constraint admin_users_email_normalized check (email = lower(btrim(email))),
  constraint admin_users_display_name_not_blank
    check (display_name is null or btrim(display_name) <> ''),
  constraint admin_users_role_allowed check (role in ('owner', 'admin', 'editor'))
);

create unique index admin_users_email_unique_idx on public.admin_users (lower(email));

create table public.checkout_settings (
  id boolean primary key default true,
  paystack_enabled boolean not null,
  whatsapp_enabled boolean not null,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  constraint checkout_settings_singleton_key check (id),
  constraint checkout_settings_payment_method_required
    check (paystack_enabled or whatsapp_enabled),
  constraint checkout_settings_updated_by_fk
    foreign key (updated_by) references public.admin_users(id) on delete set null
);

create or replace function public.prevent_checkout_settings_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using
    errcode = '23514',
    constraint = 'checkout_settings_singleton_required',
    message = 'The checkout settings singleton cannot be deleted.';
end;
$$;

create trigger checkout_settings_prevent_delete
before delete on public.checkout_settings
for each row execute function public.prevent_checkout_settings_delete();

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null,
  order_type text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_address text not null,
  delivery_landmark text,
  delivery_zone_id uuid,
  delivery_zone_name text not null,
  payment_method text not null,
  payment_status text not null default 'unpaid',
  fulfilment_status text not null default 'pending',
  subtotal_kobo bigint not null,
  delivery_fee_kobo bigint not null,
  total_kobo bigint not null,
  total_calories integer,
  total_protein_g numeric(10, 2),
  total_carbohydrates_g numeric(10, 2),
  total_fat_g numeric(10, 2),
  nutrition_completeness text not null,
  meal_plan_start_date date,
  meal_plan_end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_reference_not_blank check (btrim(order_reference) <> ''),
  constraint orders_reference_unique unique (order_reference),
  constraint orders_type_allowed check (order_type in ('cart', 'meal_plan')),
  constraint orders_customer_name_not_blank check (btrim(customer_name) <> ''),
  constraint orders_customer_phone_not_blank check (btrim(customer_phone) <> ''),
  constraint orders_customer_email_not_blank
    check (customer_email is null or btrim(customer_email) <> ''),
  constraint orders_delivery_address_not_blank check (btrim(delivery_address) <> ''),
  constraint orders_delivery_landmark_not_blank
    check (delivery_landmark is null or btrim(delivery_landmark) <> ''),
  constraint orders_delivery_zone_name_not_blank check (btrim(delivery_zone_name) <> ''),
  constraint orders_delivery_zone_fk
    foreign key (delivery_zone_id) references public.delivery_zones(id) on delete set null,
  constraint orders_payment_method_allowed check (payment_method in ('paystack', 'whatsapp')),
  constraint orders_payment_status_allowed
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  constraint orders_fulfilment_status_allowed
    check (fulfilment_status in (
      'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'
    )),
  constraint orders_subtotal_nonnegative check (subtotal_kobo >= 0),
  constraint orders_delivery_fee_nonnegative check (delivery_fee_kobo >= 0),
  constraint orders_total_nonnegative check (total_kobo >= 0),
  constraint orders_total_integrity check (total_kobo = subtotal_kobo + delivery_fee_kobo),
  constraint orders_total_calories_nonnegative
    check (total_calories is null or total_calories >= 0),
  constraint orders_total_protein_nonnegative
    check (total_protein_g is null or total_protein_g >= 0),
  constraint orders_total_carbohydrates_nonnegative
    check (total_carbohydrates_g is null or total_carbohydrates_g >= 0),
  constraint orders_total_fat_nonnegative check (total_fat_g is null or total_fat_g >= 0),
  constraint orders_nutrition_completeness_allowed
    check (nutrition_completeness in ('complete', 'partial', 'unavailable')),
  constraint orders_nutrition_completeness_integrity check (
    (
      nutrition_completeness = 'complete'
      and total_calories is not null
      and total_protein_g is not null
      and total_carbohydrates_g is not null
      and total_fat_g is not null
    )
    or nutrition_completeness = 'partial'
    or (
      nutrition_completeness = 'unavailable'
      and total_calories is null
      and total_protein_g is null
      and total_carbohydrates_g is null
      and total_fat_g is null
    )
  ),
  constraint orders_meal_plan_dates_integrity check (
    (
      order_type = 'cart'
      and meal_plan_start_date is null
      and meal_plan_end_date is null
    )
    or
    (
      order_type = 'meal_plan'
      and meal_plan_start_date is not null
      and meal_plan_end_date is not null
      and meal_plan_end_date - meal_plan_start_date between 1 and 6
    )
  )
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  product_id uuid,
  variant_id uuid,
  product_name text not null,
  variant_name text,
  unit_base_price_kobo bigint not null,
  quantity integer not null,
  line_total_kobo bigint not null,
  calories integer,
  protein_g numeric(8, 2),
  carbohydrates_g numeric(8, 2),
  fat_g numeric(8, 2),
  scheduled_for date,
  meal_slot text,
  created_at timestamptz not null default now(),
  constraint order_items_order_fk
    foreign key (order_id) references public.orders(id) on delete restrict,
  constraint order_items_product_fk
    foreign key (product_id) references public.products(id) on delete set null,
  constraint order_items_variant_fk
    foreign key (variant_id) references public.product_variants(id) on delete set null,
  constraint order_items_product_name_not_blank check (btrim(product_name) <> ''),
  constraint order_items_variant_name_not_blank
    check (variant_name is null or btrim(variant_name) <> ''),
  constraint order_items_unit_price_nonnegative check (unit_base_price_kobo >= 0),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_line_total_nonnegative check (line_total_kobo >= 0),
  constraint order_items_calories_nonnegative check (calories is null or calories >= 0),
  constraint order_items_protein_nonnegative check (protein_g is null or protein_g >= 0),
  constraint order_items_carbohydrates_nonnegative
    check (carbohydrates_g is null or carbohydrates_g >= 0),
  constraint order_items_fat_nonnegative check (fat_g is null or fat_g >= 0),
  constraint order_items_meal_slot_allowed
    check (meal_slot is null or meal_slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  constraint order_items_schedule_integrity check (
    (scheduled_for is null and meal_slot is null)
    or (scheduled_for is not null and meal_slot is not null)
  )
);

create table public.order_item_addons (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null,
  addon_id uuid,
  addon_name text not null,
  unit_price_kobo bigint not null,
  calories integer,
  protein_g numeric(8, 2),
  carbohydrates_g numeric(8, 2),
  fat_g numeric(8, 2),
  created_at timestamptz not null default now(),
  constraint order_item_addons_order_item_fk
    foreign key (order_item_id) references public.order_items(id) on delete restrict,
  constraint order_item_addons_addon_fk
    foreign key (addon_id) references public.product_addons(id) on delete set null,
  constraint order_item_addons_name_not_blank check (btrim(addon_name) <> ''),
  constraint order_item_addons_unit_price_nonnegative check (unit_price_kobo >= 0),
  constraint order_item_addons_calories_nonnegative check (calories is null or calories >= 0),
  constraint order_item_addons_protein_nonnegative check (protein_g is null or protein_g >= 0),
  constraint order_item_addons_carbohydrates_nonnegative
    check (carbohydrates_g is null or carbohydrates_g >= 0),
  constraint order_item_addons_fat_nonnegative check (fat_g is null or fat_g >= 0)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  payment_method text not null,
  provider text,
  amount_kobo bigint not null,
  status text not null,
  provider_reference text,
  verification_status text not null default 'unverified',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_order_fk
    foreign key (order_id) references public.orders(id) on delete restrict,
  constraint payments_method_allowed check (payment_method in ('paystack', 'whatsapp')),
  constraint payments_provider_allowed check (provider is null or provider = 'paystack'),
  constraint payments_method_provider_integrity check (
    (payment_method = 'paystack' and provider = 'paystack')
    or (payment_method = 'whatsapp' and provider is null)
  ),
  constraint payments_amount_nonnegative check (amount_kobo >= 0),
  constraint payments_status_allowed
    check (status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  constraint payments_provider_reference_not_blank
    check (provider_reference is null or btrim(provider_reference) <> ''),
  constraint payments_verification_status_allowed
    check (verification_status in ('unverified', 'verified', 'failed', 'not_applicable')),
  constraint payments_verification_method_integrity check (
    (payment_method = 'paystack' and verification_status <> 'not_applicable')
    or (payment_method = 'whatsapp' and verification_status = 'not_applicable')
  ),
  constraint payments_verified_at_integrity check (
    (verification_status = 'verified' and verified_at is not null)
    or (verification_status <> 'verified' and verified_at is null)
  )
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  email text not null,
  subject text not null,
  rating smallint not null,
  message text not null,
  created_at timestamptz not null default now(),
  constraint feedback_customer_name_not_blank check (btrim(customer_name) <> ''),
  constraint feedback_email_not_blank check (btrim(email) <> ''),
  constraint feedback_subject_not_blank check (btrim(subject) <> ''),
  constraint feedback_rating_valid check (rating between 1 and 5),
  constraint feedback_message_not_blank check (btrim(message) <> '')
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  message text not null,
  rating smallint not null,
  is_published boolean not null default false,
  published_at timestamptz,
  source_feedback_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonials_customer_name_not_blank check (btrim(customer_name) <> ''),
  constraint testimonials_message_not_blank check (btrim(message) <> ''),
  constraint testimonials_rating_valid check (rating between 1 and 5),
  constraint testimonials_publication_integrity check (
    (is_published = true and published_at is not null)
    or (is_published = false and published_at is null)
  ),
  constraint testimonials_source_feedback_fk
    foreign key (source_feedback_id) references public.feedback(id) on delete set null
);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid,
  admin_email_snapshot text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now(),
  constraint admin_audit_log_admin_user_fk
    foreign key (admin_user_id) references public.admin_users(id) on delete set null,
  constraint admin_audit_log_admin_email_not_blank
    check (admin_email_snapshot is null or btrim(admin_email_snapshot) <> ''),
  constraint admin_audit_log_actor_required
    check (admin_user_id is not null or admin_email_snapshot is not null),
  constraint admin_audit_log_action_not_blank check (btrim(action) <> ''),
  constraint admin_audit_log_entity_type_not_blank check (btrim(entity_type) <> '')
);

create index categories_enabled_sort_idx
  on public.categories (sort_order, id) where is_enabled;

create index products_category_fk_idx on public.products (category_id);
create index products_storefront_category_sort_idx
  on public.products (category_id, sort_order, id)
  where status not in ('hidden', 'archived');
create index products_admin_status_idx on public.products (status, updated_at desc);

create index product_variants_product_sort_idx
  on public.product_variants (product_id, sort_order, id);
create index product_variants_product_status_idx
  on public.product_variants (product_id, status);

create index product_addon_assignments_addon_idx
  on public.product_addon_assignments (addon_id);

create index delivery_zones_active_sort_idx
  on public.delivery_zones (sort_order, id) where is_active;

create index checkout_settings_updated_by_idx on public.checkout_settings (updated_by);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_customer_phone_idx on public.orders (customer_phone);
create index orders_customer_name_idx on public.orders (lower(customer_name));
create index orders_payment_status_created_idx
  on public.orders (payment_status, created_at desc);
create index orders_fulfilment_status_created_idx
  on public.orders (fulfilment_status, created_at desc);
create index orders_type_created_idx on public.orders (order_type, created_at desc);
create index orders_payment_method_created_idx
  on public.orders (payment_method, created_at desc);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id) where product_id is not null;
create index order_items_variant_idx on public.order_items (variant_id) where variant_id is not null;

create index order_item_addons_order_item_idx on public.order_item_addons (order_item_id);
create index order_item_addons_addon_idx
  on public.order_item_addons (addon_id) where addon_id is not null;
create unique index order_item_addons_current_addon_unique_idx
  on public.order_item_addons (order_item_id, addon_id) where addon_id is not null;

create index payments_order_created_idx on public.payments (order_id, created_at desc);
create unique index payments_provider_reference_unique_idx
  on public.payments (provider, provider_reference) where provider_reference is not null;
create index payments_status_created_idx on public.payments (status, created_at desc);

create index feedback_subject_created_idx on public.feedback (subject, created_at desc);
create index feedback_rating_created_idx on public.feedback (rating, created_at desc);

create unique index testimonials_source_feedback_unique_idx
  on public.testimonials (source_feedback_id) where source_feedback_id is not null;
create index testimonials_published_idx
  on public.testimonials (published_at desc, id) where is_published;

create index admin_audit_log_admin_created_idx
  on public.admin_audit_log (admin_user_id, created_at desc);
create index admin_audit_log_entity_created_idx
  on public.admin_audit_log (entity_type, entity_id, created_at desc);
create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

create trigger product_addons_set_updated_at
before update on public.product_addons
for each row execute function public.set_updated_at();

create trigger delivery_zones_set_updated_at
before update on public.delivery_zones
for each row execute function public.set_updated_at();

create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

create trigger checkout_settings_set_updated_at
before update on public.checkout_settings
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger testimonials_set_updated_at
before update on public.testimonials
for each row execute function public.set_updated_at();

comment on table public.product_addon_assignments is
  'Live product/group add-on compatibility; order history uses order_item_addons snapshots.';
comment on column public.products.image_path is
  'Supabase Storage object path contract; bucket and upload behavior begin in Cycle 5.';
comment on table public.orders is
  'Permanent order header storage; trusted creation and pricing begin in Cycle 12.';
comment on table public.admin_audit_log is
  'Audit storage foundation; authorized audit-writing workflows begin in later cycles.';
