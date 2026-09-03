import { supabase, supabaseConfigurationError } from "../../../lib/supabaseClient.js";

function requireSupabase() {
  if (!supabase) throw new Error(supabaseConfigurationError);
  return supabase;
}

function nullable(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

export async function getOrdersPage(filters) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("list_admin_orders", {
    p_search: nullable(filters.search),
    p_fulfilment_status: nullable(filters.fulfilmentStatus),
    p_payment_status: nullable(filters.paymentStatus),
    p_payment_method: nullable(filters.paymentMethod),
    p_order_type: nullable(filters.orderType),
    p_created_from: nullable(filters.dateFrom),
    p_created_to: nullable(filters.dateTo),
    p_page: filters.page,
    p_page_size: filters.pageSize,
  });

  if (error) throw error;
  return {
    orders: data || [],
    total: Number(data?.[0]?.total_count || 0),
  };
}

export async function getOrderByReference(orderReference) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("orders")
    .select(`
      id, order_reference, order_type, customer_name, customer_phone, customer_email,
      delivery_address, delivery_landmark, delivery_zone_name, payment_method,
      payment_status, fulfilment_status, subtotal_kobo, delivery_fee_kobo, total_kobo,
      total_calories, total_protein_g, total_carbohydrates_g, total_fat_g,
      nutrition_completeness, meal_plan_start_date, meal_plan_end_date, created_at, updated_at,
      order_items (
        id, product_name, variant_name, unit_base_price_kobo, quantity, line_total_kobo,
        calories, protein_g, carbohydrates_g, fat_g, scheduled_for, meal_slot, created_at,
        order_item_addons (
          id, addon_name, unit_price_kobo, calories, protein_g, carbohydrates_g, fat_g
        )
      ),
      payments (
        id, payment_method, provider, amount_kobo, status, provider_reference,
        verification_status, verified_at, provider_transaction_id, provider_status,
        provider_amount_kobo, provider_currency, failure_code, last_event_at, created_at, updated_at
      )
    `)
    .eq("order_reference", orderReference)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    order_items: [...(data.order_items || [])].sort((left, right) => {
      const dateOrder = String(left.scheduled_for || "").localeCompare(String(right.scheduled_for || ""));
      return dateOrder || String(left.meal_slot || "").localeCompare(String(right.meal_slot || ""));
    }),
    payments: [...(data.payments || [])].sort((left, right) => new Date(right.created_at) - new Date(left.created_at)),
  };
}

export async function updateFulfilmentStatus({ orderId, nextFulfilmentStatus }) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("update_order_fulfilment_status", {
    p_order_id: orderId,
    p_next_status: nextFulfilmentStatus,
  });

  if (error) throw error;
  return data;
}
