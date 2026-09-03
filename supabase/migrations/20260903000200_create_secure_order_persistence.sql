-- Cycle 12: server-generated references and atomic, backend-only order persistence.

create sequence private.order_reference_sequence
  as bigint
  minvalue 1000
  start with 1001;

do $$
declare
  existing_reference bigint;
begin
  select greatest(
    1000,
    coalesce(max(substring(order_reference from '^NUE-([0-9]+)$')::bigint), 0)
  )
  into existing_reference
  from public.orders
  where order_reference ~ '^NUE-[0-9]+$';

  perform setval('private.order_reference_sequence', existing_reference, true);
end;
$$;

revoke all on sequence private.order_reference_sequence from public, anon, authenticated;

create or replace function public.create_order_atomic(p_order jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_order_id uuid := gen_random_uuid();
  created_reference text := 'NUE-' || lpad(nextval('private.order_reference_sequence'::regclass)::text, 6, '0');
  created_at_value timestamptz;
  item jsonb;
  addon jsonb;
  created_item_id uuid;
begin
  if jsonb_typeof(p_order) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'Order payload must be an object.';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Order items must be a non-empty array.';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'Order items must be a non-empty array.';
  end if;

  insert into public.orders (
    id,
    order_reference,
    order_type,
    customer_name,
    customer_phone,
    customer_email,
    delivery_address,
    delivery_landmark,
    delivery_zone_id,
    delivery_zone_name,
    payment_method,
    payment_status,
    fulfilment_status,
    subtotal_kobo,
    delivery_fee_kobo,
    total_kobo,
    total_calories,
    total_protein_g,
    total_carbohydrates_g,
    total_fat_g,
    nutrition_completeness,
    meal_plan_start_date,
    meal_plan_end_date
  ) values (
    created_order_id,
    created_reference,
    p_order ->> 'order_type',
    p_order ->> 'customer_name',
    p_order ->> 'customer_phone',
    nullif(p_order ->> 'customer_email', ''),
    p_order ->> 'delivery_address',
    nullif(p_order ->> 'delivery_landmark', ''),
    nullif(p_order ->> 'delivery_zone_id', '')::uuid,
    p_order ->> 'delivery_zone_name',
    p_order ->> 'payment_method',
    'unpaid',
    'pending',
    (p_order ->> 'subtotal_kobo')::bigint,
    (p_order ->> 'delivery_fee_kobo')::bigint,
    (p_order ->> 'total_kobo')::bigint,
    (p_order ->> 'total_calories')::integer,
    (p_order ->> 'total_protein_g')::numeric,
    (p_order ->> 'total_carbohydrates_g')::numeric,
    (p_order ->> 'total_fat_g')::numeric,
    p_order ->> 'nutrition_completeness',
    (p_order ->> 'meal_plan_start_date')::date,
    (p_order ->> 'meal_plan_end_date')::date
  )
  returning created_at into created_at_value;

  for item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      variant_name,
      unit_base_price_kobo,
      quantity,
      line_total_kobo,
      calories,
      protein_g,
      carbohydrates_g,
      fat_g,
      scheduled_for,
      meal_slot
    ) values (
      created_order_id,
      nullif(item ->> 'product_id', '')::uuid,
      nullif(item ->> 'variant_id', '')::uuid,
      item ->> 'product_name',
      nullif(item ->> 'variant_name', ''),
      (item ->> 'unit_base_price_kobo')::bigint,
      (item ->> 'quantity')::integer,
      (item ->> 'line_total_kobo')::bigint,
      (item ->> 'calories')::integer,
      (item ->> 'protein_g')::numeric,
      (item ->> 'carbohydrates_g')::numeric,
      (item ->> 'fat_g')::numeric,
      (item ->> 'scheduled_for')::date,
      nullif(item ->> 'meal_slot', '')
    )
    returning id into created_item_id;

    if item ? 'addons' and jsonb_typeof(item -> 'addons') is distinct from 'array' then
      raise exception using errcode = '22023', message = 'Order item add-ons must be an array.';
    end if;

    for addon in select value from jsonb_array_elements(coalesce(item -> 'addons', '[]'::jsonb))
    loop
      insert into public.order_item_addons (
        order_item_id,
        addon_id,
        addon_name,
        unit_price_kobo,
        calories,
        protein_g,
        carbohydrates_g,
        fat_g
      ) values (
        created_item_id,
        nullif(addon ->> 'addon_id', '')::uuid,
        addon ->> 'addon_name',
        (addon ->> 'unit_price_kobo')::bigint,
        (addon ->> 'calories')::integer,
        (addon ->> 'protein_g')::numeric,
        (addon ->> 'carbohydrates_g')::numeric,
        (addon ->> 'fat_g')::numeric
      );
    end loop;
  end loop;

  return jsonb_build_object(
    'order_id', created_order_id,
    'order_reference', created_reference,
    'created_at', created_at_value,
    'payment_status', 'unpaid',
    'fulfilment_status', 'pending'
  );
end;
$$;

alter function public.create_order_atomic(jsonb, jsonb) owner to postgres;

revoke all on function public.create_order_atomic(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order_atomic(jsonb, jsonb) to service_role;

comment on function public.create_order_atomic(jsonb, jsonb) is
  'Persists one already validated server-authoritative order and all child snapshots atomically; callable only by the backend service role.';
