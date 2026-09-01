import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCartNutrition,
  calculateItemNutrition,
  calculateMealPlanNutrition,
  calculateNutrition,
  formatNutrition,
  formatNutritionValue,
  NUTRITION_STATUS,
} from "@nuede/domain/nutrition";

const completeMeal = Object.freeze({
  isGrouped: false,
  nutrition: { calories: 500, proteinG: 40, carbohydratesG: 50, fatG: 15 },
});
const partialMeal = Object.freeze({
  isGrouped: false,
  nutrition: { calories: 500, proteinG: 40, carbohydratesG: null, fatG: 15 },
});
const unavailableMeal = Object.freeze({
  isGrouped: false,
  nutrition: { calories: null, proteinG: null, carbohydratesG: null, fatG: null },
});
const completeAddon = Object.freeze({
  nutrition: { calories: 100, proteinG: 10, carbohydratesG: 5, fatG: 2 },
});
const secondAddon = Object.freeze({
  nutrition: { calories: 50, proteinG: 5, carbohydratesG: 10, fatG: 1 },
});

test("Cycle 8 calculates complete, partial, unavailable, and quantity-scaled standard meals", () => {
  const complete = calculateItemNutrition({ product: completeMeal });
  assert.deepEqual(
    { calories: complete.calories, proteinG: complete.proteinG, carbohydratesG: complete.carbohydratesG, fatG: complete.fatG },
    completeMeal.nutrition,
  );
  assert.equal(complete.status, NUTRITION_STATUS.complete);

  const partial = calculateItemNutrition({ product: partialMeal });
  assert.equal(partial.carbohydratesG, null);
  assert.equal(partial.carbohydratesGComplete, false);
  assert.equal(partial.status, NUTRITION_STATUS.partial);

  const unavailable = calculateItemNutrition({ product: unavailableMeal });
  assert.equal(unavailable.hasAny, false);
  assert.equal(unavailable.status, NUTRITION_STATUS.unavailable);

  const doubled = calculateItemNutrition({ product: completeMeal, quantity: 2 });
  assert.deepEqual(
    { calories: doubled.calories, proteinG: doubled.proteinG, carbohydratesG: doubled.carbohydratesG, fatG: doubled.fatG },
    { calories: 1000, proteinG: 80, carbohydratesG: 100, fatG: 30 },
  );
});

test("Cycle 8 uses selected grouped variants without double-counting the parent", () => {
  const grouped = {
    isGrouped: true,
    nutrition: { calories: 999, proteinG: 999, carbohydratesG: 999, fatG: 999 },
  };
  const variantA = { nutrition: { calories: 500, proteinG: 35, carbohydratesG: 60, fatG: 12 } };
  const variantB = { nutrition: { calories: 700, proteinG: 45, carbohydratesG: 80, fatG: 20 } };

  assert.equal(calculateItemNutrition({ product: grouped, variant: variantA }).calories, 500);
  assert.equal(calculateItemNutrition({ product: grouped, variant: variantB }).calories, 700);
  assert.equal(calculateItemNutrition({ product: grouped, variant: variantB, quantity: 2 }).calories, 1400);
  assert.equal(calculateItemNutrition({ product: grouped }).status, NUTRITION_STATUS.unavailable);
});

test("Cycle 8 adds one or many add-ons once per configured meal before scaling quantity", () => {
  const oneAddon = calculateItemNutrition({ product: completeMeal, addons: [completeAddon] });
  assert.deepEqual(
    { calories: oneAddon.calories, proteinG: oneAddon.proteinG, carbohydratesG: oneAddon.carbohydratesG, fatG: oneAddon.fatG },
    { calories: 600, proteinG: 50, carbohydratesG: 55, fatG: 17 },
  );

  const multiple = calculateItemNutrition({ product: completeMeal, addons: [completeAddon, secondAddon] });
  assert.deepEqual(
    { calories: multiple.calories, proteinG: multiple.proteinG, carbohydratesG: multiple.carbohydratesG, fatG: multiple.fatG },
    { calories: 650, proteinG: 55, carbohydratesG: 65, fatG: 18 },
  );

  const doubled = calculateItemNutrition({ product: completeMeal, addons: [completeAddon], quantity: 2 });
  assert.deepEqual(
    { calories: doubled.calories, proteinG: doubled.proteinG, carbohydratesG: doubled.carbohydratesG, fatG: doubled.fatG },
    { calories: 1200, proteinG: 100, carbohydratesG: 110, fatG: 34 },
  );
});

test("Cycle 8 propagates unavailable and partial add-on fields without treating them as zero", () => {
  const unavailableAddon = { nutrition: { calories: null, proteinG: null, carbohydratesG: null, fatG: null } };
  const withUnavailable = calculateItemNutrition({ product: completeMeal, addons: [unavailableAddon] });
  assert.equal(withUnavailable.calories, 500);
  assert.equal(withUnavailable.caloriesComplete, false);
  assert.equal(withUnavailable.status, NUTRITION_STATUS.partial);

  const partialAddon = { nutrition: { calories: 100, proteinG: null, carbohydratesG: 5, fatG: 2 } };
  const withPartial = calculateItemNutrition({ product: completeMeal, addons: [partialAddon] });
  assert.equal(withPartial.calories, 600);
  assert.equal(withPartial.proteinG, 40);
  assert.equal(withPartial.proteinGComplete, false);
  assert.equal(withPartial.status, NUTRITION_STATUS.partial);
});

test("Cycle 8 generic aggregation is immutable, field-aware, and predictable when empty", () => {
  const first = calculateItemNutrition({ product: completeMeal });
  const second = calculateItemNutrition({ product: partialMeal });
  const aggregate = calculateNutrition([first, second]);
  assert.equal(aggregate.calories, 1000);
  assert.equal(aggregate.carbohydratesG, 50);
  assert.equal(aggregate.carbohydratesGComplete, false);
  assert.equal(aggregate.status, NUTRITION_STATUS.partial);
  assert.equal(Object.isFrozen(aggregate), true);

  const empty = calculateNutrition([]);
  assert.equal(empty.status, NUTRITION_STATUS.unavailable);
  assert.equal(empty.calories, null);
});

test("Cycle 8 cart helper aggregates normalized configured-item fixtures without cart state", () => {
  const itemA = { product: { isGrouped: false, nutrition: { calories: 600, proteinG: 50, carbohydratesG: 55, fatG: 17 } }, quantity: 2 };
  const itemB = { product: { isGrouped: false, nutrition: { calories: 400, proteinG: 30, carbohydratesG: 45, fatG: 13 } }, quantity: 1 };
  const total = calculateCartNutrition([itemA, itemB]);
  assert.deepEqual(
    { calories: total.calories, proteinG: total.proteinG, carbohydratesG: total.carbohydratesG, fatG: total.fatG },
    { calories: 1600, proteinG: 130, carbohydratesG: 155, fatG: 47 },
  );
  assert.equal(total.status, NUTRITION_STATUS.complete);
});

test("Cycle 8 meal-plan helper aggregates slot fixtures and divides by explicit plan duration", () => {
  const dailyMeal = {
    product: { isGrouped: false, nutrition: { calories: 2000, proteinG: 120, carbohydratesG: 180, fatG: 60 } },
    quantity: 1,
  };
  const plan = calculateMealPlanNutrition({
    durationDays: 5,
    days: [
      { slots: { breakfast: dailyMeal } },
      { slots: { lunch: [dailyMeal] } },
      { items: [dailyMeal] },
      [dailyMeal],
      { slots: [{ items: [dailyMeal] }] },
    ],
  });

  assert.deepEqual(
    { calories: plan.total.calories, proteinG: plan.total.proteinG, carbohydratesG: plan.total.carbohydratesG, fatG: plan.total.fatG },
    { calories: 10000, proteinG: 600, carbohydratesG: 900, fatG: 300 },
  );
  assert.deepEqual(
    { calories: plan.averageDaily.calories, proteinG: plan.averageDaily.proteinG, carbohydratesG: plan.averageDaily.carbohydratesG, fatG: plan.averageDaily.fatG },
    { calories: 2000, proteinG: 120, carbohydratesG: 180, fatG: 60 },
  );
  assert.equal(plan.durationDays, 5);
  assert.equal(plan.status, NUTRITION_STATUS.complete);

  const incompletePlan = calculateMealPlanNutrition({
    durationDays: 5,
    days: [{ items: [dailyMeal, { product: partialMeal, quantity: 1 }] }],
  });
  assert.equal(incompletePlan.status, NUTRITION_STATUS.partial);
  assert.equal(incompletePlan.averageDaily.carbohydratesGComplete, false);
});

test("Cycle 8 central formatting handles known, decimal, partial, and unavailable values", () => {
  assert.equal(formatNutritionValue("calories", 610), "610 kcal");
  assert.equal(formatNutritionValue("proteinG", 44, { includeLabel: true }), "44g protein");
  assert.equal(formatNutritionValue("carbohydratesG", 188.125, { includeLabel: true }), "188.13g carbs");
  assert.equal(formatNutritionValue("fatG", null), "Unknown");
  assert.equal(formatNutritionValue("fatG", undefined, { unknownLabel: "Unavailable" }), "Unavailable");
  assert.deepEqual(formatNutrition({ calories: 610, proteinG: null }).calories, "610 kcal");
});
