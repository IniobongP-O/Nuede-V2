import { calculateAuthoritativeItemNutrition, calculateAuthoritativeOrderNutrition, nutritionColumns, nutritionFromRow } from "./nutrition.js";
import { addKobo, calculateItemPrice } from "./pricing.js";

function addonSnapshot(addon) {
  return {
    addon_id: addon.id,
    addon_name: addon.name,
    unit_price_kobo: Number(addon.price_kobo),
    ...nutritionColumns(nutritionFromRow(addon)),
  };
}

export function buildOrderSnapshot(request, validated) {
  // Names, prices, nutrition, and delivery details are copied at purchase time.
  // Historical orders must not change when the live catalog or zones are edited.
  const items = validated.items.map((item) => {
    const pricing = calculateItemPrice(item);
    const nutrition = calculateAuthoritativeItemNutrition(item);
    return {
      product_id: item.product.id,
      variant_id: item.variant?.id || null,
      product_name: item.product.name,
      variant_name: item.variant?.name || null,
      unit_base_price_kobo: item.basePriceKobo,
      configured_unit_price_kobo: pricing.unitPriceKobo,
      quantity: item.configuration.quantity,
      line_total_kobo: pricing.lineTotalKobo,
      ...nutritionColumns(nutrition),
      nutrition_completeness: nutrition.status,
      scheduled_for: item.scheduledFor,
      meal_slot: item.mealSlot,
      addons: item.addons.map(addonSnapshot),
      calculatedNutrition: nutrition,
    };
  });

  // Delivery is charged once per order, not once per item or meal-plan day.
  const subtotalKobo = addKobo(items.map((item) => item.line_total_kobo));
  const totalKobo = addKobo([subtotalKobo, validated.deliveryZone.feeKobo]);
  const nutrition = calculateAuthoritativeOrderNutrition(items.map((item) => item.calculatedNutrition));
  const nutritionSnapshot = nutritionColumns(nutrition);

  return {
    order: {
      order_type: request.orderType,
      customer_name: request.customer.fullName,
      customer_phone: request.customer.phone,
      customer_email: request.customer.email || null,
      delivery_address: request.customer.address,
      delivery_landmark: request.customer.landmark || null,
      delivery_zone_id: validated.deliveryZone.id,
      delivery_zone_name: validated.deliveryZone.name,
      payment_method: request.paymentMethod,
      subtotal_kobo: subtotalKobo,
      delivery_fee_kobo: validated.deliveryZone.feeKobo,
      total_kobo: totalKobo,
      total_calories: nutritionSnapshot.calories,
      total_protein_g: nutritionSnapshot.protein_g,
      total_carbohydrates_g: nutritionSnapshot.carbohydrates_g,
      total_fat_g: nutritionSnapshot.fat_g,
      nutrition_completeness: nutrition.status,
      meal_plan_start_date: request.orderType === "meal_plan" ? request.startDate : null,
      meal_plan_end_date: request.orderType === "meal_plan" ? request.days.at(-1).date : null,
    },
    items,
    nutrition,
  };
}
