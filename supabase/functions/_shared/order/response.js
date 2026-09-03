function responseNutrition(nutrition) {
  return {
    status: nutrition.status,
    calories: nutrition.calories,
    proteinG: nutrition.proteinG,
    carbohydratesG: nutrition.carbohydratesG,
    fatG: nutrition.fatG,
  };
}

function responseItem(item) {
  return {
    productId: item.product_id,
    variantId: item.variant_id,
    productName: item.product_name,
    variantName: item.variant_name,
    unitBasePriceKobo: item.unit_base_price_kobo,
    unitPriceKobo: item.configured_unit_price_kobo,
    quantity: item.quantity,
    lineTotalKobo: item.line_total_kobo,
    nutrition: responseNutrition(item.calculatedNutrition),
    scheduledFor: item.scheduled_for,
    mealSlot: item.meal_slot,
    addons: item.addons.map((addon) => ({
      addonId: addon.addon_id,
      addonName: addon.addon_name,
      unitPriceKobo: addon.unit_price_kobo,
      nutrition: {
        calories: addon.calories,
        proteinG: addon.protein_g,
        carbohydratesG: addon.carbohydrates_g,
        fatG: addon.fat_g,
      },
    })),
  };
}

function scheduleFor(request, items) {
  if (request.orderType !== "meal_plan") return null;
  const itemBySlot = new Map(items.map((item) => [`${item.scheduled_for}:${item.meal_slot}`, item]));
  return {
    durationDays: request.durationDays,
    startDate: request.startDate,
    endDate: request.days.at(-1).date,
    days: request.days.map((day) => ({
      date: day.date,
      slots: Object.fromEntries(Object.keys(day.slots).map((mealSlot) => {
        const item = itemBySlot.get(`${day.date}:${mealSlot}`);
        return [mealSlot, item ? responseItem(item) : null];
      })),
    })),
  };
}

export function buildSuccessResponse(request, snapshot, persisted) {
  const items = snapshot.items.map(responseItem);
  return {
    orderId: persisted.order_id,
    orderReference: persisted.order_reference,
    createdAt: persisted.created_at,
    orderType: request.orderType,
    paymentMethod: request.paymentMethod,
    paymentStatus: persisted.payment_status,
    fulfilmentStatus: persisted.fulfilment_status,
    subtotalKobo: snapshot.order.subtotal_kobo,
    deliveryFeeKobo: snapshot.order.delivery_fee_kobo,
    totalKobo: snapshot.order.total_kobo,
    deliveryZone: {
      id: snapshot.order.delivery_zone_id,
      name: snapshot.order.delivery_zone_name,
    },
    nutrition: responseNutrition(snapshot.nutrition),
    items,
    schedule: scheduleFor(request, snapshot.items),
  };
}
