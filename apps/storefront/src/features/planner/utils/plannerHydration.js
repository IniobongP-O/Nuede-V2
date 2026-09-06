import { calculateMealPlanNutrition, calculateNutrition } from "@nuede/domain/nutrition";

import {
  calculateConfiguredDisplayPrice,
  calculateConfiguredItemNutrition,
  validateProductConfiguration,
} from "../../product-detail/utils/customizationModel.js";
import { getPlanCapacity, getSelectedMealCount, PLANNER_SLOT_KEYS, validatePlanStructure } from "./plannerModel.js";

export const PLANNER_MEAL_STATUS = Object.freeze({
  valid: "valid",
  stale: "stale",
  soldOut: "sold_out",
  pricePending: "price_pending",
  unavailable: "unavailable",
  invalidVariant: "invalid_variant",
  invalidAddon: "invalid_addon",
});

const statusDetails = Object.freeze({
  valid: { label: "Available", message: "This meal is available." },
  stale: { label: "No longer available", message: "This saved meal is no longer on the menu." },
  sold_out: { label: "Sold out", message: "This selected meal is currently sold out." },
  price_pending: { label: "Price pending", message: "This selection cannot be ordered until its price is confirmed." },
  unavailable: { label: "Unavailable", message: "This selected meal is not currently available." },
  invalid_variant: { label: "Option changed", message: "The selected meal option is no longer available." },
  invalid_addon: { label: "Add-on changed", message: "A selected add-on is unavailable or no longer compatible." },
});

function unavailableNutrition() {
  return calculateNutrition([{}]);
}

function statusFor(configuration, product, variant, addons, missingAddonIds) {
  if (product.menuStatus === "sold_out") return PLANNER_MEAL_STATUS.soldOut;
  if (product.menuStatus === "price_pending") return PLANNER_MEAL_STATUS.pricePending;
  if (product.status !== "available" || product.menuStatus !== "available") return PLANNER_MEAL_STATUS.unavailable;
  if (product.isGrouped) {
    if (!variant || variant.productId !== product.id) return PLANNER_MEAL_STATUS.invalidVariant;
    if (variant.status === "sold_out") return PLANNER_MEAL_STATUS.soldOut;
    if (variant.priceKobo === null) return PLANNER_MEAL_STATUS.pricePending;
    if (variant.status !== "available" || variant.isOrderable === false) return PLANNER_MEAL_STATUS.invalidVariant;
  } else if (configuration.variantId !== null) return PLANNER_MEAL_STATUS.invalidVariant;
  if (missingAddonIds.length || addons.some((addon) => !addon.isAvailable || addon.priceKobo === null)) return PLANNER_MEAL_STATUS.invalidAddon;
  const validation = validateProductConfiguration({ product, ...configuration, quantity: 1 });
  return validation.valid ? PLANNER_MEAL_STATUS.valid : PLANNER_MEAL_STATUS.unavailable;
}

export function hydratePlannerMeal(configuration, products = []) {
  // Plans persist stable IDs only. Re-resolving them keeps availability and
  // compatibility current while preserving stale slots for customer correction.
  const product = products.find((candidate) => candidate.id === configuration.productId) || null;
  if (!product) {
    return {
      configuration,
      product: null,
      variant: null,
      addons: [],
      missingAddonIds: [...configuration.addonIds],
      status: PLANNER_MEAL_STATUS.stale,
      ...statusDetails.stale,
      orderable: false,
      price: { unitPriceKobo: null, linePriceKobo: null, complete: false },
      nutrition: unavailableNutrition(),
    };
  }
  const variant = configuration.variantId ? product.variants.find((candidate) => candidate.id === configuration.variantId) || null : null;
  const addonsById = new Map(product.addons.map((addon) => [addon.id, addon]));
  const addons = configuration.addonIds.flatMap((id) => addonsById.get(id) || []);
  const missingAddonIds = configuration.addonIds.filter((id) => !addonsById.has(id));
  const status = statusFor(configuration, product, variant, addons, missingAddonIds);
  const rawPrice = calculateConfiguredDisplayPrice(product, configuration.variantId, configuration.addonIds, 1);
  const price = missingAddonIds.length ? { unitPriceKobo: null, linePriceKobo: null, complete: false } : rawPrice;
  const knownNutrition = calculateConfiguredItemNutrition(product, configuration.variantId, configuration.addonIds, 1);
  // Preserve known nutrition but mark it partial when a persisted add-on can no
  // longer be resolved; treating the missing contribution as zero is misleading.
  const nutrition = missingAddonIds.length ? calculateNutrition([knownNutrition, {}]) : knownNutrition;
  return {
    configuration,
    product,
    variant,
    addons,
    missingAddonIds,
    status,
    ...statusDetails[status],
    orderable: status === PLANNER_MEAL_STATUS.valid,
    price,
    nutrition,
  };
}

export function hydratePlan(plan, products = []) {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      date: day.date,
      slots: Object.fromEntries(PLANNER_SLOT_KEYS.map((slot) => [
        slot,
        day.slots[slot] ? hydratePlannerMeal(day.slots[slot], products) : null,
      ])),
    })),
  };
}

export function calculatePlannerSummary(plan, products = []) {
  const hydratedPlan = hydratePlan(plan, products);
  const meals = hydratedPlan.days.flatMap((day) => PLANNER_SLOT_KEYS.flatMap((slot) => day.slots[slot] || []));
  const nutrition = calculateMealPlanNutrition({
    durationDays: plan.durationDays,
    days: hydratedPlan.days.map((day) => PLANNER_SLOT_KEYS.flatMap((slot) => day.slots[slot]?.nutrition || [])),
  });
  // Planner totals are live-catalog estimates. Invalid selections are omitted
  // from the number and surfaced as issues that block checkout readiness.
  let estimatedFoodTotalKobo = 0;
  let pricedMealCount = 0;
  for (const meal of meals) {
    if (!meal.orderable || !meal.price.complete) continue;
    const next = estimatedFoodTotalKobo + meal.price.linePriceKobo;
    if (!Number.isSafeInteger(next)) {
      estimatedFoodTotalKobo = null;
      break;
    }
    estimatedFoodTotalKobo = next;
    pricedMealCount += 1;
  }
  const selectedMealCount = getSelectedMealCount(plan);
  const structure = validatePlanStructure(plan);
  const invalidMeals = meals.filter((meal) => !meal.orderable);
  const issues = [
    ...structure.issues,
    ...invalidMeals.map((meal) => ({ code: meal.status, message: meal.message, productId: meal.configuration.productId })),
  ];
  return {
    hydratedPlan,
    selectedMealCount,
    slotCapacity: getPlanCapacity(plan),
    startDate: plan.days[0]?.date || plan.startDate,
    endDate: plan.days.at(-1)?.date || plan.startDate,
    nutrition,
    estimatedFoodTotalKobo,
    priceComplete: estimatedFoodTotalKobo !== null && pricedMealCount === meals.length,
    invalidMealCount: invalidMeals.length,
    issues,
    checkoutReady: structure.valid && selectedMealCount > 0 && invalidMeals.length === 0,
  };
}
