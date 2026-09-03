-- Cycle 15: scalable active-admin order browsing and validated fulfilment updates.

create extension if not exists pg_trgm with schema extensions;

create index orders_reference_search_idx
  on public.orders using gin (order_reference extensions.gin_trgm_ops);
create index orders_customer_name_search_idx
  on public.orders using gin (customer_name extensions.gin_trgm_ops);
create index orders_customer_phone_search_idx
  on public.orders using gin (customer_phone extensions.gin_trgm_ops);
create index payments_provider_reference_search_idx
  on public.payments using gin (provider_reference extensions.gin_trgm_ops)
  where provider_reference is not null;

create or replace function public.list_admin_orders(
  p_search text default null,
  p_fulfilment_status text default null,
  p_payment_status text default null,
  p_payment_method text default null,
  p_order_type text default null,
  p_created_from date default null,
  p_created_to date default null,
  p_page integer default 1,
  p_page_size integer default 20
)
returns table (
  id uuid,
  order_reference text,
  customer_name text,
  customer_phone text,
  total_kobo bigint,
  payment_status text,
  payment_method text,
  fulfilment_status text,
  order_type text,
  created_at timestamptz,
  updated_at timestamptz,
  provider_reference text,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_search text := nullif(btrim(p_search), '');
  safe_page integer := greatest(coalesce(p_page, 1), 1);
  safe_page_size integer := least(greatest(coalesce(p_page_size, 20), 1), 100);
begin
  if not (select private.is_active_admin()) then
    raise exception using errcode = '42501', message = 'ADMIN_ACCESS_REQUIRED';
  end if;

  if p_created_from is not null and p_created_to is not null and p_created_from > p_created_to then
    raise exception using errcode = '22023', message = 'INVALID_ORDER_DATE_RANGE';
  end if;

  return query
  select
    order_row.id,
    order_row.order_reference,
    order_row.customer_name,
    order_row.customer_phone,
    order_row.total_kobo,
    order_row.payment_status,
    order_row.payment_method,
    order_row.fulfilment_status,
    order_row.order_type,
    order_row.created_at,
    order_row.updated_at,
    latest_payment.provider_reference,
    count(*) over () as total_count
  from public.orders as order_row
  left join lateral (
    select payment.provider_reference
    from public.payments as payment
    where payment.order_id = order_row.id
    order by payment.created_at desc, payment.id desc
    limit 1
  ) as latest_payment on true
  where
    (p_fulfilment_status is null or order_row.fulfilment_status = p_fulfilment_status)
    and (p_payment_status is null or order_row.payment_status = p_payment_status)
    and (p_payment_method is null or order_row.payment_method = p_payment_method)
    and (p_order_type is null or order_row.order_type = p_order_type)
    and (p_created_from is null or order_row.created_at >= p_created_from::timestamptz)
    and (p_created_to is null or order_row.created_at < (p_created_to + 1)::timestamptz)
    and (
      normalized_search is null
      or order_row.order_reference ilike '%' || normalized_search || '%'
      or order_row.customer_name ilike '%' || normalized_search || '%'
      or order_row.customer_phone ilike '%' || normalized_search || '%'
      or exists (
        select 1
        from public.payments as searched_payment
        where searched_payment.order_id = order_row.id
          and searched_payment.provider_reference ilike '%' || normalized_search || '%'
      )
    )
  order by order_row.created_at desc, order_row.id desc
  limit safe_page_size
  offset (safe_page - 1) * safe_page_size;
end;
$$;

alter function public.list_admin_orders(text, text, text, text, text, date, date, integer, integer) owner to postgres;
revoke all on function public.list_admin_orders(text, text, text, text, text, date, date, integer, integer) from public, anon, authenticated;
grant execute on function public.list_admin_orders(text, text, text, text, text, date, date, integer, integer) to authenticated;

comment on function public.list_admin_orders(text, text, text, text, text, date, date, integer, integer) is
  'Returns a newest-first, filtered and paginated operational order projection only to active Nuede admins.';

create or replace function private.can_transition_fulfilment_status(p_current text, p_next text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_current = 'pending' then p_next in ('confirmed', 'cancelled')
    when p_current = 'confirmed' then p_next in ('preparing', 'cancelled')
    when p_current = 'preparing' then p_next in ('ready', 'cancelled')
    when p_current = 'ready' then p_next in ('out_for_delivery', 'cancelled')
    when p_current = 'out_for_delivery' then p_next = 'delivered'
    else false
  end;
$$;

revoke all on function private.can_transition_fulfilment_status(text, text) from public, anon, authenticated;

create or replace function public.update_order_fulfilment_status(p_order_id uuid, p_next_status text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text;
  order_record public.orders%rowtype;
begin
  select admin_user.email
  into actor_email
  from public.admin_users as admin_user
  where admin_user.id = actor_id
    and admin_user.is_active
    and admin_user.role in ('owner', 'admin', 'editor');

  if actor_email is null then
    raise exception using errcode = '42501', message = 'ADMIN_ACCESS_REQUIRED';
  end if;

  select * into order_record
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'ORDER_NOT_FOUND';
  end if;

  if not private.can_transition_fulfilment_status(order_record.fulfilment_status, p_next_status) then
    raise exception using
      errcode = 'P0001',
      message = 'INVALID_FULFILMENT_TRANSITION',
      detail = order_record.fulfilment_status || ' -> ' || coalesce(p_next_status, 'null');
  end if;

  -- The explicit assignment is intentional: snapshots, totals, payment state,
  -- and provider identity can never be overwritten by this browser mutation.
  update public.orders
  set fulfilment_status = p_next_status
  where id = order_record.id;

  insert into public.admin_audit_log (
    admin_user_id,
    admin_email_snapshot,
    action,
    entity_type,
    entity_id,
    previous_values,
    new_values
  ) values (
    actor_id,
    actor_email,
    case when p_next_status = 'cancelled' then 'order_cancelled' else 'order_fulfilment_status_changed' end,
    'order',
    order_record.id,
    jsonb_build_object(
      'order_reference', order_record.order_reference,
      'fulfilment_status', order_record.fulfilment_status
    ),
    jsonb_build_object(
      'order_reference', order_record.order_reference,
      'fulfilment_status', p_next_status
    )
  );

  return jsonb_build_object(
    'id', order_record.id,
    'order_reference', order_record.order_reference,
    'previous_fulfilment_status', order_record.fulfilment_status,
    'fulfilment_status', p_next_status
  );
end;
$$;

alter function public.update_order_fulfilment_status(uuid, text) owner to postgres;
revoke all on function public.update_order_fulfilment_status(uuid, text) from public, anon, authenticated;
grant execute on function public.update_order_fulfilment_status(uuid, text) to authenticated;

comment on function public.update_order_fulfilment_status(uuid, text) is
  'Atomically validates one forward fulfilment/cancellation transition and records its authenticated active-admin audit event; payment and purchase snapshots are untouched.';
