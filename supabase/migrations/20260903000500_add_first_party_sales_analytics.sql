-- Cycle 16: trusted, first-party sales analytics for active Nuede admins.
-- Paid revenue is recognized in Africa/Lagos on the first trusted Paystack
-- verification timestamp for an order. The canonical relation is deliberately
-- one row per order so repeated provider notifications cannot multiply revenue.

create index payments_verified_sales_idx
  on public.payments (order_id, verified_at)
  where status = 'paid' and verification_status = 'verified';

create or replace view private.analytics_eligible_sales as
select
  order_row.id as order_id,
  order_row.order_reference,
  order_row.order_type,
  order_row.payment_method,
  order_row.delivery_zone_id,
  order_row.delivery_zone_name,
  order_row.subtotal_kobo,
  order_row.delivery_fee_kobo,
  order_row.total_kobo as revenue_kobo,
  trusted_payment.paid_at,
  (trusted_payment.paid_at at time zone 'Africa/Lagos')::date as sale_date
from public.orders as order_row
cross join lateral (
  select min(payment.verified_at) as paid_at
  from public.payments as payment
  where payment.order_id = order_row.id
    and payment.payment_method = 'paystack'
    and payment.provider = 'paystack'
    and payment.status = 'paid'
    and payment.verification_status = 'verified'
    and payment.verified_at is not null
    and payment.amount_kobo = order_row.total_kobo
    and payment.provider_amount_kobo = order_row.total_kobo
    and upper(payment.provider_currency) = 'NGN'
) as trusted_payment
where order_row.payment_method = 'paystack'
  and order_row.payment_status = 'paid'
  and trusted_payment.paid_at is not null;

create or replace view private.daily_sales as
select
  sale.sale_date,
  sum(sale.revenue_kobo)::bigint as revenue_kobo,
  count(*)::bigint as paid_orders,
  coalesce(sum(item_totals.items_sold), 0)::bigint as items_sold
from private.analytics_eligible_sales as sale
left join lateral (
  select sum(item.quantity)::bigint as items_sold
  from public.order_items as item
  where item.order_id = sale.order_id
) as item_totals on true
group by sale.sale_date;

create or replace view private.product_sales as
select
  sale.sale_date,
  item.product_id,
  item.product_name,
  sum(item.quantity)::bigint as quantity_sold,
  sum(item.unit_base_price_kobo * item.quantity)::bigint as revenue_kobo
from private.analytics_eligible_sales as sale
join public.order_items as item on item.order_id = sale.order_id
group by sale.sale_date, item.product_id, item.product_name;

create or replace view private.variant_sales as
select
  sale.sale_date,
  item.product_id,
  item.product_name,
  item.variant_id,
  item.variant_name,
  sum(item.quantity)::bigint as quantity_sold,
  sum(item.unit_base_price_kobo * item.quantity)::bigint as revenue_kobo
from private.analytics_eligible_sales as sale
join public.order_items as item on item.order_id = sale.order_id
where item.variant_id is not null or item.variant_name is not null
group by
  sale.sale_date,
  item.product_id,
  item.product_name,
  item.variant_id,
  item.variant_name;

create or replace view private.addon_sales as
select
  sale.sale_date,
  addon.addon_id,
  addon.addon_name,
  sum(item.quantity)::bigint as quantity_sold,
  sum(addon.unit_price_kobo * item.quantity)::bigint as revenue_kobo
from private.analytics_eligible_sales as sale
join public.order_items as item on item.order_id = sale.order_id
join public.order_item_addons as addon on addon.order_item_id = item.id
group by sale.sale_date, addon.addon_id, addon.addon_name;

create or replace view private.delivery_zone_sales as
select
  sale.sale_date,
  sale.delivery_zone_id,
  sale.delivery_zone_name,
  count(*)::bigint as paid_orders,
  sum(sale.revenue_kobo)::bigint as revenue_kobo,
  sum(sale.delivery_fee_kobo)::bigint as delivery_fee_kobo
from private.analytics_eligible_sales as sale
group by sale.sale_date, sale.delivery_zone_id, sale.delivery_zone_name;

create or replace view private.payment_method_sales as
select
  sale.sale_date,
  sale.payment_method,
  count(*)::bigint as paid_orders,
  sum(sale.revenue_kobo)::bigint as revenue_kobo
from private.analytics_eligible_sales as sale
group by sale.sale_date, sale.payment_method;

revoke all on private.analytics_eligible_sales from public, anon, authenticated;
revoke all on private.daily_sales from public, anon, authenticated;
revoke all on private.product_sales from public, anon, authenticated;
revoke all on private.variant_sales from public, anon, authenticated;
revoke all on private.addon_sales from public, anon, authenticated;
revoke all on private.delivery_zone_sales from public, anon, authenticated;
revoke all on private.payment_method_sales from public, anon, authenticated;

create or replace function public.get_admin_sales_analytics(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not (select private.is_active_admin()) then
    raise exception using errcode = '42501', message = 'ADMIN_ACCESS_REQUIRED';
  end if;

  if p_from is null or p_to is null or p_from > p_to then
    raise exception using errcode = '22023', message = 'INVALID_ANALYTICS_DATE_RANGE';
  end if;

  with
  range_sales as (
    select *
    from private.analytics_eligible_sales
    where sale_date between p_from and p_to
  ),
  summary as (
    select
      coalesce(sum(sale.revenue_kobo), 0)::bigint as revenue_kobo,
      count(*)::bigint as paid_orders,
      coalesce((
        select sum(item.quantity)::bigint
        from range_sales as item_sale
        join public.order_items as item on item.order_id = item_sale.order_id
      ), 0)::bigint as items_sold
    from range_sales as sale
  ),
  daily as (
    select
      (p_from + series.day_offset)::date as sale_date,
      coalesce(metric.revenue_kobo, 0)::bigint as revenue_kobo,
      coalesce(metric.paid_orders, 0)::bigint as paid_orders,
      coalesce(metric.items_sold, 0)::bigint as items_sold
    from generate_series(0, p_to - p_from) as series(day_offset)
    left join private.daily_sales as metric on metric.sale_date = p_from + series.day_offset
  ),
  products as (
    select
      product.product_id,
      product.product_name,
      sum(product.quantity_sold)::bigint as quantity_sold,
      sum(product.revenue_kobo)::bigint as revenue_kobo
    from private.product_sales as product
    where product.sale_date between p_from and p_to
    group by product.product_id, product.product_name
  ),
  variants as (
    select
      variant.product_id,
      variant.product_name,
      variant.variant_id,
      variant.variant_name,
      sum(variant.quantity_sold)::bigint as quantity_sold,
      sum(variant.revenue_kobo)::bigint as revenue_kobo
    from private.variant_sales as variant
    where variant.sale_date between p_from and p_to
    group by variant.product_id, variant.product_name, variant.variant_id, variant.variant_name
  ),
  addons as (
    select
      addon.addon_id,
      addon.addon_name,
      sum(addon.quantity_sold)::bigint as quantity_sold,
      sum(addon.revenue_kobo)::bigint as revenue_kobo
    from private.addon_sales as addon
    where addon.sale_date between p_from and p_to
    group by addon.addon_id, addon.addon_name
  ),
  zones as (
    select
      zone.delivery_zone_id,
      zone.delivery_zone_name,
      sum(zone.paid_orders)::bigint as paid_orders,
      sum(zone.revenue_kobo)::bigint as revenue_kobo,
      sum(zone.delivery_fee_kobo)::bigint as delivery_fee_kobo
    from private.delivery_zone_sales as zone
    where zone.sale_date between p_from and p_to
    group by zone.delivery_zone_id, zone.delivery_zone_name
  ),
  methods as (
    select
      method.payment_method,
      sum(method.paid_orders)::bigint as paid_orders,
      sum(method.revenue_kobo)::bigint as revenue_kobo
    from private.payment_method_sales as method
    where method.sale_date between p_from and p_to
    group by method.payment_method
  )
  select jsonb_build_object(
    'range', jsonb_build_object(
      'from', p_from,
      'to', p_to,
      'timezone', 'Africa/Lagos',
      'start_inclusive', (p_from::timestamp at time zone 'Africa/Lagos'),
      'end_exclusive', ((p_to + 1)::timestamp at time zone 'Africa/Lagos')
    ),
    'summary', (
      select jsonb_build_object(
        'revenue_kobo', summary.revenue_kobo::text,
        'paid_orders', summary.paid_orders,
        'average_order_value_kobo', case
          when summary.paid_orders = 0 then '0'
          else round(summary.revenue_kobo::numeric / summary.paid_orders)::bigint::text
        end,
        'items_sold', summary.items_sold
      )
      from summary
    ),
    'daily_sales', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', daily.sale_date,
        'revenue_kobo', daily.revenue_kobo::text,
        'paid_orders', daily.paid_orders,
        'items_sold', daily.items_sold
      ) order by daily.sale_date)
      from daily
    ), '[]'::jsonb),
    'product_sales', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_id', product.product_id,
        'product_name', product.product_name,
        'quantity_sold', product.quantity_sold,
        'revenue_kobo', product.revenue_kobo::text,
        'revenue_rank', product.revenue_rank,
        'quantity_rank', product.quantity_rank
      ) order by product.revenue_rank, product.product_name)
      from (
        select products.*,
          row_number() over (order by revenue_kobo desc, quantity_sold desc, product_name)::bigint as revenue_rank,
          row_number() over (order by quantity_sold desc, revenue_kobo desc, product_name)::bigint as quantity_rank
        from products
      ) as product
    ), '[]'::jsonb),
    'variant_sales', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_id', variant.product_id,
        'product_name', variant.product_name,
        'variant_id', variant.variant_id,
        'variant_name', variant.variant_name,
        'quantity_sold', variant.quantity_sold,
        'revenue_kobo', variant.revenue_kobo::text
      ) order by variant.revenue_kobo desc, variant.quantity_sold desc, variant.product_name, variant.variant_name)
      from variants as variant
    ), '[]'::jsonb),
    'addon_sales', coalesce((
      select jsonb_agg(jsonb_build_object(
        'addon_id', addon.addon_id,
        'addon_name', addon.addon_name,
        'quantity_sold', addon.quantity_sold,
        'revenue_kobo', addon.revenue_kobo::text
      ) order by addon.revenue_kobo desc, addon.quantity_sold desc, addon.addon_name)
      from addons as addon
    ), '[]'::jsonb),
    'delivery_zone_sales', coalesce((
      select jsonb_agg(jsonb_build_object(
        'delivery_zone_id', zone.delivery_zone_id,
        'delivery_zone_name', zone.delivery_zone_name,
        'paid_orders', zone.paid_orders,
        'revenue_kobo', zone.revenue_kobo::text,
        'delivery_fee_kobo', zone.delivery_fee_kobo::text
      ) order by zone.revenue_kobo desc, zone.paid_orders desc, zone.delivery_zone_name)
      from zones as zone
    ), '[]'::jsonb),
    'payment_method_sales', coalesce((
      select jsonb_agg(jsonb_build_object(
        'payment_method', method.payment_method,
        'paid_orders', method.paid_orders,
        'revenue_kobo', method.revenue_kobo::text,
        'revenue_share_percent', case
          when summary.revenue_kobo = 0 then 0
          else round((method.revenue_kobo::numeric * 100) / summary.revenue_kobo, 1)
        end
      ) order by method.revenue_kobo desc, method.payment_method)
      from methods as method
      cross join summary
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

alter function public.get_admin_sales_analytics(date, date) owner to postgres;
revoke all on function public.get_admin_sales_analytics(date, date) from public, anon, authenticated;
grant execute on function public.get_admin_sales_analytics(date, date) to authenticated;

comment on view private.analytics_eligible_sales is
  'Canonical one-row-per-order Cycle 16 sale eligibility: order paid plus exact, verified Paystack evidence; WhatsApp has no trusted paid workflow yet.';
comment on view private.daily_sales is 'Africa/Lagos daily paid revenue, distinct paid-order count, and top-level item quantity.';
comment on view private.product_sales is 'Purchase-date product snapshot quantity and base-product revenue; add-ons and delivery are excluded.';
comment on view private.variant_sales is 'Purchase-date variant snapshot quantity and base-variant revenue for configured variant lines.';
comment on view private.addon_sales is 'Purchase-date add-on quantity and revenue, multiplied by its parent order-item quantity.';
comment on view private.delivery_zone_sales is 'Purchase-date delivery-zone snapshot order, revenue, and delivery-fee aggregates.';
comment on view private.payment_method_sales is 'Purchase-date payment-method order and revenue aggregates over eligible sales.';
comment on function public.get_admin_sales_analytics(date, date) is
  'Returns one reconciliable, range-filtered analytics payload to active admins only; dates are inclusive Africa/Lagos business dates.';
