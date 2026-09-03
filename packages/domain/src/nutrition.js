export const NUTRITION_STATUS = Object.freeze({
  complete: "complete",
  partial: "partial",
  unavailable: "unavailable",
});

export const NUTRITION_FIELDS = Object.freeze([
  Object.freeze({ key: "calories", label: "Calories", shortLabel: "calories", unit: "kcal" }),
  Object.freeze({ key: "proteinG", label: "Protein", shortLabel: "protein", unit: "g" }),
  Object.freeze({ key: "carbohydratesG", label: "Carbs", shortLabel: "carbs", unit: "g" }),
  Object.freeze({ key: "fatG", label: "Fat", shortLabel: "fat", unit: "g" }),
]);

const fieldByKey = new Map(NUTRITION_FIELDS.map((field) => [field.key, field]));
const nutritionNumberFormatter = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 2,
});

function isKnownNutritionValue(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function nutritionSource(entry) {
  if (entry && typeof entry === "object" && "nutrition" in entry) return entry.nutrition;
  return entry;
}

function buildNutritionResult(values, completeness) {
  const result = {};
  for (const { key } of NUTRITION_FIELDS) {
    result[key] = isKnownNutritionValue(values[key]) ? values[key] : null;
    result[`${key}Complete`] = completeness[key] === true;
  }

  // A known subtotal remains useful even when one component omitted that field;
  // completeness records that the visible number is only a partial total.
  result.hasAny = NUTRITION_FIELDS.some(({ key }) => result[key] !== null);
  result.isComplete = result.hasAny
    && NUTRITION_FIELDS.every(({ key }) => result[`${key}Complete`]);
  result.status = !result.hasAny
    ? NUTRITION_STATUS.unavailable
    : result.isComplete ? NUTRITION_STATUS.complete : NUTRITION_STATUS.partial;
  return Object.freeze(result);
}

function unavailableNutrition() {
  return buildNutritionResult({}, {});
}

function scaleNutrition(nutrition, multiplier) {
  const values = {};
  const completeness = {};
  for (const { key } of NUTRITION_FIELDS) {
    values[key] = nutrition[key] === null ? null : nutrition[key] * multiplier;
    completeness[key] = nutrition[`${key}Complete`];
  }
  return buildNutritionResult(values, completeness);
}

function requirePositiveQuantity(quantity) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new RangeError("Nutrition quantity must be a positive whole number.");
  }
  return quantity;
}

export function calculateNutrition(entries = []) {
  if (!Array.isArray(entries)) throw new TypeError("Nutrition entries must be an array.");
  if (!entries.length) return unavailableNutrition();

  const values = {};
  const completeness = {};
  for (const { key } of NUTRITION_FIELDS) {
    let total = 0;
    let knownCount = 0;
    let complete = true;

    for (const entry of entries) {
      const source = nutritionSource(entry);
      const value = source?.[key];
      const known = isKnownNutritionValue(value);
      const explicitlyComplete = typeof source?.[`${key}Complete`] === "boolean"
        ? source[`${key}Complete`]
        : known;
      if (known) {
        total += value;
        knownCount += 1;
      }
      if (!known || !explicitlyComplete) complete = false;
    }

    values[key] = knownCount ? total : null;
    completeness[key] = complete && knownCount === entries.length;
  }

  return buildNutritionResult(values, completeness);
}

/**
 * Calculates one configured line using the selected variant as the grouped
 * product base, then adds each selected add-on and applies quantity once.
 * Missing nutrition is preserved as partial/unavailable rather than treated as
 * zero, which prevents incomplete catalog data from looking nutritionally exact.
 */
export function calculateItemNutrition({ product, variant = null, addons = [], quantity = 1 } = {}) {
  requirePositiveQuantity(quantity);
  if (!Array.isArray(addons)) throw new TypeError("Nutrition add-ons must be an array.");

  const base = product?.isGrouped ? variant : product;
  if (!base) return unavailableNutrition();
  const perUnit = calculateNutrition([base, ...addons]);
  return scaleNutrition(perUnit, quantity);
}

function isCalculatedNutrition(value) {
  return value
    && typeof value === "object"
    && Object.values(NUTRITION_STATUS).includes(value.status)
    && NUTRITION_FIELDS.every(({ key }) => key in value);
}

export function calculateCartNutrition(items = []) {
  if (!Array.isArray(items)) throw new TypeError("Cart nutrition items must be an array.");
  const itemNutrition = items.map((item) => (
    isCalculatedNutrition(item) ? item : calculateItemNutrition(item)
  ));
  return calculateNutrition(itemNutrition);
}

function slotItems(slot) {
  if (!slot) return [];
  if (Array.isArray(slot)) return slot;
  if (Array.isArray(slot.items)) return slot.items;
  return slot.product ? [slot] : [];
}

function dayItems(day) {
  if (!day) return [];
  if (Array.isArray(day)) return day;
  if (Array.isArray(day.items)) return day.items;
  if (Array.isArray(day.slots)) return day.slots.flatMap(slotItems);
  if (day.slots && typeof day.slots === "object") {
    return Object.values(day.slots).flatMap(slotItems);
  }
  return [];
}

export function calculateMealPlanNutrition({ days = [], durationDays = days.length } = {}) {
  if (!Array.isArray(days)) throw new TypeError("Meal-plan days must be an array.");
  requirePositiveQuantity(durationDays);

  const total = calculateCartNutrition(days.flatMap(dayItems));
  const averageDaily = scaleNutrition(total, 1 / durationDays);
  return Object.freeze({
    durationDays,
    status: total.status,
    total,
    averageDaily,
  });
}

export function formatNutritionNumber(value) {
  return isKnownNutritionValue(value) ? nutritionNumberFormatter.format(value) : null;
}

export function formatNutritionValue(key, value, { includeLabel = false, unknownLabel = "Unknown" } = {}) {
  const field = fieldByKey.get(key);
  if (!field) throw new RangeError(`Unknown nutrition field: ${key}`);
  const formatted = formatNutritionNumber(value);
  if (formatted === null) return unknownLabel;
  const measurement = field.unit === "g" ? `${formatted}g` : `${formatted} ${field.unit}`;
  return includeLabel && field.key !== "calories"
    ? `${measurement} ${field.shortLabel}`
    : measurement;
}

export function formatNutrition(nutrition, options) {
  return Object.freeze(Object.fromEntries(
    NUTRITION_FIELDS.map(({ key }) => [key, formatNutritionValue(key, nutrition?.[key], options)]),
  ));
}
