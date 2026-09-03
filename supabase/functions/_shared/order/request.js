export const MEAL_SLOTS = Object.freeze(["breakfast", "lunch", "dinner", "snack"]);

export function flattenOrderItems(request) {
  if (request.orderType === "cart") {
    return request.items.map((configuration) => ({
      configuration,
      scheduledFor: null,
      mealSlot: null,
    }));
  }

  return request.days.flatMap((day) => MEAL_SLOTS.flatMap((mealSlot) => {
    const configuration = day.slots[mealSlot];
    return configuration ? [{ configuration, scheduledFor: day.date, mealSlot }] : [];
  }));
}

export function collectSelectionIds(items) {
  const productIds = new Set();
  const variantIds = new Set();
  const addonIds = new Set();

  for (const { configuration } of items) {
    productIds.add(configuration.productId);
    if (configuration.variantId) variantIds.add(configuration.variantId);
    configuration.addonIds.forEach((id) => addonIds.add(id));
  }

  return {
    productIds: [...productIds],
    variantIds: [...variantIds],
    addonIds: [...addonIds],
  };
}
