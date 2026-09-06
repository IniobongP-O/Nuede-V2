import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { NUTRITION_STATUS } from "@nuede/domain/nutrition";
import {
  getStoredPlan,
  normalizeStoredPlan,
  parseStoredPlan,
  PLANNER_STORAGE_KEY,
  setStoredPlan,
} from "../apps/storefront/src/features/planner/storage/plannerStorage.js";
import {
  calculatePlannerSummary,
  hydratePlannerMeal,
  PLANNER_MEAL_STATUS,
} from "../apps/storefront/src/features/planner/utils/plannerHydration.js";
import {
  addCalendarDays,
  clearPlan,
  createPlan,
  generatePlanDates,
  getNextEmptySlot,
  getPlanCapacity,
  getSelectedMealCount,
  moveSlotMeal,
  populatedDaysRemovedByResize,
  quickAddMeal,
  removeSlotMeal,
  resizePlan,
  serializePlanForCheckout,
  setSlotMeal,
  validatePlanStructure,
} from "../apps/storefront/src/features/planner/utils/plannerModel.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8");
const productId = "20000000-0000-4000-8000-000000000001";
const groupId = "20000000-0000-4000-8000-000000000008";
const variantId = "30000000-0000-4000-8000-000000000001";
const addonId = "40000000-0000-4000-8000-000000000001";
const otherAddonId = "40000000-0000-4000-8000-000000000002";

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function configuration(overrides = {}) {
  return { productId, variantId: null, addonIds: [], quantity: 1, ...overrides };
}

const standardProduct = Object.freeze({
  id: productId,
  name: "Daily plate",
  isGrouped: false,
  status: "available",
  menuStatus: "available",
  priceKobo: 800000,
  nutrition: { calories: 2000, proteinG: 120, carbohydratesG: 180, fatG: 60 },
  variants: [],
  addons: [
    { id: addonId, name: "Extra protein", priceKobo: 150000, isAvailable: true, nutrition: { calories: 100, proteinG: 20, carbohydratesG: 2, fatG: 2 } },
    { id: otherAddonId, name: "Greens", priceKobo: 50000, isAvailable: true, nutrition: { calories: 50, proteinG: 3, carbohydratesG: 8, fatG: 1 } },
  ],
});

const groupedProduct = Object.freeze({
  ...standardProduct,
  id: groupId,
  name: "Choose a bowl",
  isGrouped: true,
  priceKobo: null,
  variants: [{
    id: variantId,
    productId: groupId,
    name: "Rice bowl",
    status: "available",
    isOrderable: true,
    priceKobo: 900000,
    nutrition: { calories: 700, proteinG: 40, carbohydratesG: 80, fatG: 20 },
  }],
});

test("Cycle 10 creates deterministic local-calendar plans for every supported duration", () => {
  for (const durationDays of [2, 3, 4, 5, 6, 7]) {
    const plan = createPlan({ durationDays, startDate: "2026-09-02" });
    assert.equal(plan.days.length, durationDays);
    assert.equal(getPlanCapacity(plan), durationDays * 4);
    assert.deepEqual(Object.keys(plan.days[0].slots), ["breakfast", "lunch", "dinner", "snack"]);
    assert.equal(plan.days.at(-1).date, addCalendarDays("2026-09-02", durationDays - 1));
    assert.equal(validatePlanStructure(plan).valid, true);
  }
  assert.deepEqual(generatePlanDates("2028-02-28", 3), ["2028-02-28", "2028-02-29", "2028-03-01"]);
  assert.throws(() => createPlan({ durationDays: 1, startDate: "2026-09-02" }));
  assert.throws(() => generatePlanDates("2026-02-30", 5));
});

test("Cycle 10 expands without loss and identifies destructive shrinking", () => {
  const original = setSlotMeal(createPlan({ durationDays: 3, startDate: "2026-09-02" }), { date: "2026-09-04", slot: "dinner" }, configuration());
  const expanded = resizePlan(original, 5);
  assert.equal(expanded.days[2].slots.dinner.productId, productId);
  assert.equal(expanded.days[3].slots.breakfast, null);
  assert.equal(getPlanCapacity(expanded), 20);

  const dayFiveMeal = setSlotMeal(expanded, { date: "2026-09-06", slot: "snack" }, configuration());
  assert.equal(populatedDaysRemovedByResize(dayFiveMeal, 3).length, 1);
  const shrunk = resizePlan(dayFiveMeal, 3);
  assert.equal(shrunk.days.length, 3);
  assert.equal(getSelectedMealCount(shrunk), 1);
});

test("Cycle 10 assigns, replaces, removes, moves, swaps, quick-adds, and clears one-meal slots", () => {
  const lunch = { date: "2026-09-02", slot: "lunch" };
  const dinner = { date: "2026-09-02", slot: "dinner" };
  let plan = createPlan({ durationDays: 2, startDate: "2026-09-02" });
  plan = setSlotMeal(plan, lunch, configuration());
  plan = setSlotMeal(plan, lunch, configuration({ addonIds: [addonId] }));
  assert.deepEqual(plan.days[0].slots.lunch.addonIds, [addonId]);
  assert.equal(getSelectedMealCount(plan), 1);
  plan = removeSlotMeal(plan, lunch);
  assert.equal(getSelectedMealCount(plan), 0);

  const first = quickAddMeal(plan, configuration());
  assert.deepEqual(first.address, { date: "2026-09-02", slot: "breakfast" });
  const second = setSlotMeal(first.plan, dinner, configuration({ addonIds: [addonId] }));
  const swapped = moveSlotMeal(second, dinner, first.address);
  assert.deepEqual(swapped.days[0].slots.breakfast.addonIds, [addonId]);
  assert.deepEqual(swapped.days[0].slots.dinner.addonIds, []);
  assert.deepEqual(getNextEmptySlot(swapped), { date: "2026-09-02", slot: "lunch" });
  assert.equal(getSelectedMealCount(clearPlan(swapped)), 0);
});

test("Cycle 10 persists only validated IDs and recovers malformed browser data by slot", () => {
  const fallback = { durationDays: 2, startDate: "2026-09-02" };
  assert.equal(PLANNER_STORAGE_KEY, "nuede:v2:meal-plan");
  assert.equal(parseStoredPlan("not json", fallback).durationDays, 2);
  assert.equal(normalizeStoredPlan({ version: 1, durationDays: 99, startDate: "2026-09-02", days: [] }, fallback).durationDays, 2);

  const stored = {
    version: 1,
    durationDays: 2,
    startDate: "2026-09-02",
    days: [{
      date: "2026-09-02",
      slots: {
        breakfast: configuration(),
        lunch: { ...configuration(), quantity: 4 },
        dinner: { ...configuration(), addonIds: [addonId, addonId] },
        snack: null,
        unsupported: configuration(),
      },
    }],
  };
  const normalized = normalizeStoredPlan(stored, fallback);
  assert.equal(normalized.days[0].slots.breakfast.productId, productId);
  assert.equal(normalized.days[0].slots.lunch, null);
  assert.equal(normalized.days[0].slots.dinner, null);
  assert.equal(Object.hasOwn(normalized.days[0].slots, "unsupported"), false);

  const storage = new MemoryStorage();
  assert.equal(setStoredPlan(normalized, storage), true);
  const payload = JSON.parse(storage.getItem(PLANNER_STORAGE_KEY));
  assert.deepEqual(Object.keys(payload).sort(), ["days", "durationDays", "startDate", "version"]);
  assert.doesNotMatch(storage.getItem(PLANNER_STORAGE_KEY), /price|nutrition|productName|image/i);
  assert.deepEqual(getStoredPlan(storage, fallback), normalized);
});

test("Cycle 10 rolls saved planner dates forward from the real calendar", () => {
  const stored = {
    version: 1,
    durationDays: 2,
    startDate: "2026-09-04",
    days: [
      { date: "2026-09-04", slots: { breakfast: configuration() } },
      { date: "2026-09-05", slots: { dinner: configuration({ addonIds: [addonId] }) } },
    ],
  };

  const normalized = normalizeStoredPlan(stored, { startDate: "2026-09-07" });
  assert.equal(normalized.startDate, "2026-09-07");
  assert.deepEqual(normalized.days.map(({ date }) => date), ["2026-09-07", "2026-09-08"]);
  assert.equal(normalized.days[0].slots.breakfast.productId, productId);
  assert.deepEqual(normalized.days[1].slots.dinner.addonIds, [addonId]);
});

test("Cycle 10 hydrates current standard/grouped pricing, nutrition, and stale catalog states", () => {
  const standard = hydratePlannerMeal(configuration({ addonIds: [addonId] }), [standardProduct]);
  assert.equal(standard.status, PLANNER_MEAL_STATUS.valid);
  assert.equal(standard.price.linePriceKobo, 950000);
  assert.equal(standard.nutrition.calories, 2100);

  const grouped = hydratePlannerMeal(configuration({ productId: groupId, variantId }), [groupedProduct]);
  assert.equal(grouped.variant.name, "Rice bowl");
  assert.equal(grouped.price.linePriceKobo, 900000);

  const stale = hydratePlannerMeal(configuration(), []);
  assert.equal(stale.status, PLANNER_MEAL_STATUS.stale);
  assert.equal(stale.product, null);
  assert.equal(stale.orderable, false);

  const missingVariant = hydratePlannerMeal(configuration({ productId: groupId, variantId: "30000000-0000-4000-8000-000000000099" }), [groupedProduct]);
  assert.equal(missingVariant.status, PLANNER_MEAL_STATUS.invalidVariant);
  const missingAddon = hydratePlannerMeal(configuration({ addonIds: [addonId] }), [{ ...standardProduct, addons: [] }]);
  assert.equal(missingAddon.status, PLANNER_MEAL_STATUS.invalidAddon);
  assert.equal(missingAddon.nutrition.status, NUTRITION_STATUS.partial);
});

test("Cycle 10 summary uses plan duration for averages and integer-kobo food estimates", () => {
  let plan = createPlan({ durationDays: 5, startDate: "2026-09-02" });
  for (const day of plan.days) plan = setSlotMeal(plan, { date: day.date, slot: "breakfast" }, configuration());
  const summary = calculatePlannerSummary(plan, [standardProduct]);
  assert.equal(summary.selectedMealCount, 5);
  assert.equal(summary.slotCapacity, 20);
  assert.equal(summary.nutrition.total.calories, 10000);
  assert.equal(summary.nutrition.averageDaily.calories, 2000);
  assert.equal(summary.nutrition.averageDaily.proteinG, 120);
  assert.equal(summary.nutrition.averageDaily.carbohydratesG, 180);
  assert.equal(summary.nutrition.averageDaily.fatG, 60);
  assert.equal(summary.estimatedFoodTotalKobo, 4000000);
  assert.equal(summary.checkoutReady, true);

  const partialProduct = { ...standardProduct, nutrition: { ...standardProduct.nutrition, carbohydratesG: null } };
  assert.equal(calculatePlannerSummary(plan, [partialProduct]).nutrition.status, NUTRITION_STATUS.partial);
  const empty = calculatePlannerSummary(clearPlan(plan), [standardProduct]);
  assert.equal(empty.nutrition.status, NUTRITION_STATUS.unavailable);
  assert.equal(empty.checkoutReady, false);
});

test("Cycle 10 serializes clean future checkout input without cart or trusted snapshots", () => {
  const plan = setSlotMeal(
    createPlan({ durationDays: 2, startDate: "2026-09-02" }),
    { date: "2026-09-02", slot: "lunch" },
    configuration({ addonIds: [addonId] }),
  );
  const input = serializePlanForCheckout(plan);
  assert.equal(input.orderType, "meal_plan");
  assert.equal(input.days[0].slots.lunch.quantity, 1);
  assert.equal(input.days[0].slots.breakfast, null);
  assert.doesNotMatch(JSON.stringify(input), /price|subtotal|nutrition|productName|delivery|payment/i);
});

test("Cycle 10 keeps planner architecture separate from cart, Supabase writes, and Cycle 11+", async () => {
  const page = await read("apps/storefront/src/pages/PlannerPage.jsx");
  const model = await read("apps/storefront/src/features/planner/utils/plannerModel.js");
  const storage = await read("apps/storefront/src/features/planner/storage/plannerStorage.js");
  const hydration = await read("apps/storefront/src/features/planner/utils/plannerHydration.js");
  const migrations = await read("supabase/migrations/README.md");
  assert.doesNotMatch(`${page}\n${model}\n${storage}\n${hydration}`, /useCart|CartProvider|cartContext|addItem\(|\.from\(["']|service.role/i);
  assert.match(page, /ProductDetailDialog/);
  assert.match(page, /allowQuantity={false}/);
  assert.match(storage, /nuede:v2:meal-plan/);
  assert.match(model, /orderType: "meal_plan"/);
  assert.doesNotMatch(`${page}\n${model}\n${storage}`, /deliveryAddress|deliveryZone|paymentMethod|Paystack|WhatsApp|createOrder/i);
  assert.doesNotMatch(migrations, /create table public\.(meal_plans|meal_plan_days|meal_plan_slots)/i);
});
