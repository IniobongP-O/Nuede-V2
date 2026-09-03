import { calculateCartNutrition, calculateItemNutrition } from "../../../../packages/domain/src/nutrition.js";

function nutritionNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function nutritionFromRow(row) {
  return {
    calories: nutritionNumber(row?.calories),
    proteinG: nutritionNumber(row?.protein_g),
    carbohydratesG: nutritionNumber(row?.carbohydrates_g),
    fatG: nutritionNumber(row?.fat_g),
  };
}

export function calculateAuthoritativeItemNutrition(item) {
  // Grouped parent nutrition is not combined with its variant: the selected
  // variant is the purchased base, matching storefront calculations.
  return calculateItemNutrition({
    product: {
      isGrouped: item.product.product_type === "grouped",
      nutrition: nutritionFromRow(item.product),
    },
    variant: item.variant ? { nutrition: nutritionFromRow(item.variant) } : null,
    addons: item.addons.map((addon) => ({ nutrition: nutritionFromRow(addon) })),
    quantity: item.configuration.quantity,
  });
}

export function calculateAuthoritativeOrderNutrition(itemNutritions) {
  return calculateCartNutrition(itemNutritions);
}

export function nutritionColumns(nutrition) {
  return {
    calories: nutrition.calories,
    protein_g: nutrition.proteinG,
    carbohydrates_g: nutrition.carbohydratesG,
    fat_g: nutrition.fatG,
  };
}
