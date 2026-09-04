import { OrderError } from "./errors.js";

export function persistenceItems(items) {
  return items.map((item) => ({
    product_id: item.product_id,
    variant_id: item.variant_id,
    product_name: item.product_name,
    variant_name: item.variant_name,
    unit_base_price_kobo: item.unit_base_price_kobo,
    quantity: item.quantity,
    line_total_kobo: item.line_total_kobo,
    calories: item.calories,
    protein_g: item.protein_g,
    carbohydrates_g: item.carbohydrates_g,
    fat_g: item.fat_g,
    scheduled_for: item.scheduled_for,
    meal_slot: item.meal_slot,
    addons: item.addons,
  }));
}

export async function persistOrderAtomically(client, snapshot) {
  // The RPC is persistence-only: all pricing decisions were made from current
  // database rows above. One transaction prevents an order header surviving
  // without every item and add-on snapshot.
  const { data, error } = await client.rpc("create_order_atomic", {
    p_order: snapshot.order,
    p_items: persistenceItems(snapshot.items),
  });

  if (error?.message === "PAYMENT_METHOD_DISABLED") {
    throw new OrderError("PAYMENT_METHOD_DISABLED", "That payment method is not currently available.", {
      status: 422, stage: "business_validation", cause: error,
    });
  }
  if (error || !data?.order_id || !data?.order_reference) {
    throw new OrderError("ORDER_CREATION_FAILED", "The order could not be saved. Please try again.", {
      status: 500,
      stage: "persistence",
      cause: error,
    });
  }

  return data;
}
