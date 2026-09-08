import { plannerConfigurationSchema, plannerDateSchema, plannerStorageEnvelopeSchema } from "@nuede/validation/planner";

import {
  createPlan,
  generatePlanDates,
  getNextPlanStartDate,
  PLANNER_SLOT_KEYS,
  serializePlanForCheckout,
} from "../utils/plannerModel.js";

export const PLANNER_STORAGE_KEY = "nuede:v2:meal-plan";
export const PLANNER_STORAGE_VERSION = 1;

/** Resolves an injected storage adapter or the browser's accessible localStorage. */
function browserStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

/** Rebuilds a canonical current-date plan while salvaging valid persisted slots. */
export function normalizeStoredPlan(value, fallbackOptions = {}) {
  // Browser storage may be stale or manually edited. Rebuild the canonical date
  // grid from the real calendar and salvage valid slots by their day position.
  const envelope = plannerStorageEnvelopeSchema.safeParse(value);
  if (!envelope.success) return createPlan(fallbackOptions);
  const { durationDays, startDate } = envelope.data;
  const storedDates = generatePlanDates(startDate, durationDays);
  const daysByDate = new Map();
  for (const candidate of envelope.data.days) {
    if (!candidate || typeof candidate !== "object" || !plannerDateSchema.safeParse(candidate.date).success || !storedDates.includes(candidate.date)) continue;
    const candidateSlots = candidate.slots && typeof candidate.slots === "object" ? candidate.slots : {};
    daysByDate.set(candidate.date, {
      date: candidate.date,
      slots: Object.fromEntries(PLANNER_SLOT_KEYS.map((slot) => {
        const value = candidateSlots[slot];
        if (value === null || value === undefined) return [slot, null];
        const parsed = plannerConfigurationSchema.safeParse(value);
        return [slot, parsed.success ? parsed.data : null];
      })),
    });
  }
  const currentStartDate = fallbackOptions.startDate || getNextPlanStartDate();
  const plan = createPlan({ durationDays, startDate: currentStartDate });
  return {
    ...plan,
    days: plan.days.map((day, index) => {
      const storedDay = daysByDate.get(storedDates[index]);
      if (!storedDay) return day;
      return {
        date: day.date,
        slots: Object.fromEntries(PLANNER_SLOT_KEYS.map((slot) => [slot, storedDay.slots[slot]])),
      };
    }),
  };
}

/** Parses serialized plan state and falls back to a new plan when corrupted. */
export function parseStoredPlan(serialized, fallbackOptions = {}) {
  if (serialized === null || serialized === undefined || serialized === "") return createPlan(fallbackOptions);
  try {
    return normalizeStoredPlan(JSON.parse(serialized), fallbackOptions);
  } catch {
    return createPlan(fallbackOptions);
  }
}

/** Reads a plan without allowing browser storage failures to break the planner. */
export function getStoredPlan(storage, fallbackOptions = {}) {
  const target = browserStorage(storage);
  if (!target) return createPlan(fallbackOptions);
  try {
    return parseStoredPlan(target.getItem(PLANNER_STORAGE_KEY), fallbackOptions);
  } catch {
    return createPlan(fallbackOptions);
  }
}

/** Persists the canonical plan envelope and reports whether the write succeeded. */
export function setStoredPlan(plan, storage) {
  const target = browserStorage(storage);
  if (!target) return false;
  try {
    // Reuse the checkout serializer so persistence and submission cannot drift in
    // slot shape, while still treating the saved plan as untrusted on restoration.
    const checkoutInput = serializePlanForCheckout(plan);
    target.setItem(PLANNER_STORAGE_KEY, JSON.stringify({
      version: PLANNER_STORAGE_VERSION,
      durationDays: checkoutInput.durationDays,
      startDate: checkoutInput.startDate,
      days: checkoutInput.days,
    }));
    return true;
  } catch {
    return false;
  }
}
