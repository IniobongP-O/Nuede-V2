import {
  plannerConfigurationSchema,
  plannerDateSchema,
  plannerDurationSchema,
} from "@nuede/validation/planner";

export const PLANNER_DURATIONS = Object.freeze([2, 3, 4, 5, 6, 7]);
export const DEFAULT_PLANNER_DURATION = 5;
export const PLANNER_SLOTS = Object.freeze([
  Object.freeze({ key: "breakfast", label: "Breakfast" }),
  Object.freeze({ key: "lunch", label: "Lunch" }),
  Object.freeze({ key: "dinner", label: "Dinner" }),
  Object.freeze({ key: "snack", label: "Snack" }),
]);
export const PLANNER_SLOT_KEYS = Object.freeze(PLANNER_SLOTS.map(({ key }) => key));

// Plan shape: { durationDays, startDate, days: [{ date, slots }] }. Each named
// slot is either null or one canonical quantity-1 product configuration.

function pad(value) {
  return String(value).padStart(2, "0");
}

export function calendarDateFromLocalDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new TypeError("A valid date is required.");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addCalendarDays(calendarDate, amount) {
  if (!plannerDateSchema.safeParse(calendarDate).success || !Number.isSafeInteger(amount)) {
    throw new TypeError("A valid calendar date and whole-day offset are required.");
  }
  const [year, month, day] = calendarDate.split("-").map(Number);
  // Calendar arithmetic uses UTC so schedules do not shift across local DST or
  // timezone boundaries; display conversion is deliberately handled separately.
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function getNextPlanStartDate(now = new Date()) {
  return addCalendarDays(calendarDateFromLocalDate(now), 1);
}

export function calendarDateToLocalDate(calendarDate) {
  plannerDateSchema.parse(calendarDate);
  const [year, month, day] = calendarDate.split("-").map(Number);
  // Local noon avoids midnight-offset edge cases when formatting a date-only
  // value while preserving the user's intended calendar day.
  return new Date(year, month - 1, day, 12);
}

export function formatPlannerDate(calendarDate, options = { weekday: "short", day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat("en-NG", options).format(calendarDateToLocalDate(calendarDate));
}

export function generatePlanDates(startDate, durationDays) {
  const duration = plannerDurationSchema.parse(durationDays);
  plannerDateSchema.parse(startDate);
  return Array.from({ length: duration }, (_, index) => addCalendarDays(startDate, index));
}

export function createEmptySlots() {
  return Object.fromEntries(PLANNER_SLOT_KEYS.map((key) => [key, null]));
}

function createDay(date, slots = createEmptySlots()) {
  return { date, slots: { ...createEmptySlots(), ...slots } };
}

export function normalizePlannerConfiguration(configuration) {
  const result = plannerConfigurationSchema.safeParse(configuration);
  if (!result.success) return null;
  return { ...result.data, addonIds: [...result.data.addonIds] };
}

export function createPlan({ durationDays = DEFAULT_PLANNER_DURATION, startDate = getNextPlanStartDate() } = {}) {
  const dates = generatePlanDates(startDate, durationDays);
  return {
    durationDays,
    startDate,
    days: dates.map((date) => createDay(date)),
  };
}

export function resizePlan(plan, durationDays) {
  plannerDurationSchema.parse(durationDays);
  // Match by date rather than array position so retained days keep their meals;
  // callers separately confirm before shrinking away populated trailing days.
  const existingDays = new Map((plan?.days || []).map((day) => [day.date, day]));
  const dates = generatePlanDates(plan.startDate, durationDays);
  return {
    durationDays,
    startDate: plan.startDate,
    days: dates.map((date) => createDay(date, existingDays.get(date)?.slots)),
  };
}

export function getPlanCapacity(planOrDuration) {
  const duration = typeof planOrDuration === "number" ? planOrDuration : planOrDuration?.durationDays;
  return plannerDurationSchema.parse(duration) * PLANNER_SLOT_KEYS.length;
}

export function getSelectedMealCount(plan) {
  return (plan?.days || []).reduce(
    (total, day) => total + PLANNER_SLOT_KEYS.filter((slot) => Boolean(day.slots?.[slot])).length,
    0,
  );
}

export function isSlotAddress(address) {
  return Boolean(
    address
    && plannerDateSchema.safeParse(address.date).success
    && PLANNER_SLOT_KEYS.includes(address.slot),
  );
}

export function getSlotMeal(plan, address) {
  if (!isSlotAddress(address)) return null;
  return plan.days.find((day) => day.date === address.date)?.slots?.[address.slot] || null;
}

export function setSlotMeal(plan, address, configuration) {
  if (!isSlotAddress(address) || !plan.days.some((day) => day.date === address.date)) return plan;
  const normalized = configuration === null ? null : normalizePlannerConfiguration(configuration);
  if (configuration !== null && !normalized) return plan;
  return {
    ...plan,
    days: plan.days.map((day) => day.date === address.date
      ? { ...day, slots: { ...day.slots, [address.slot]: normalized } }
      : day),
  };
}

export function removeSlotMeal(plan, address) {
  return setSlotMeal(plan, address, null);
}

export function clearPlan(plan) {
  return { ...plan, days: plan.days.map((day) => createDay(day.date)) };
}

export function getNextEmptySlot(plan) {
  for (const day of plan.days) {
    for (const slot of PLANNER_SLOT_KEYS) {
      if (!day.slots[slot]) return { date: day.date, slot };
    }
  }
  return null;
}

export function quickAddMeal(plan, configuration) {
  // Quick-add is deterministic: fill chronological days and the declared slot
  // order before reporting that the plan has no remaining capacity.
  const address = getNextEmptySlot(plan);
  return address ? { plan: setSlotMeal(plan, address, configuration), address } : { plan, address: null };
}

export function moveSlotMeal(plan, source, target) {
  if (!isSlotAddress(source) || !isSlotAddress(target)) return plan;
  const sourceMeal = getSlotMeal(plan, source);
  if (!sourceMeal || source.date === target.date && source.slot === target.slot) return plan;
  // Moving onto an occupied slot swaps the meals instead of silently deleting
  // the target selection.
  const targetMeal = getSlotMeal(plan, target);
  return setSlotMeal(setSlotMeal(plan, target, sourceMeal), source, targetMeal);
}

export function populatedDaysRemovedByResize(plan, durationDays) {
  if (durationDays >= plan.durationDays) return [];
  return plan.days.slice(durationDays).filter((day) => PLANNER_SLOT_KEYS.some((slot) => Boolean(day.slots[slot])));
}

export function serializePlanForCheckout(plan) {
  // Serialization intentionally emits catalog identities and schedule only;
  // display data and estimates are reloaded authoritatively by checkout.
  return {
    orderType: "meal_plan",
    durationDays: plan.durationDays,
    startDate: plan.startDate,
    days: plan.days.map((day) => ({
      date: day.date,
      slots: Object.fromEntries(PLANNER_SLOT_KEYS.map((slot) => [
        slot,
        day.slots[slot] ? { ...day.slots[slot], addonIds: [...day.slots[slot].addonIds], quantity: 1 } : null,
      ])),
    })),
  };
}

export function validatePlanStructure(plan) {
  const issues = [];
  const duration = plannerDurationSchema.safeParse(plan?.durationDays);
  const startDate = plannerDateSchema.safeParse(plan?.startDate);
  if (!duration.success) issues.push({ code: "invalid_duration", message: "Choose a plan length from 2 to 7 days." });
  if (!startDate.success) issues.push({ code: "invalid_start_date", message: "The plan start date is invalid." });
  if (!duration.success || !startDate.success || !Array.isArray(plan?.days)) return { valid: false, issues };
  const expectedDates = generatePlanDates(plan.startDate, plan.durationDays);
  if (plan.days.length !== plan.durationDays || plan.days.some((day, index) => day.date !== expectedDates[index])) {
    issues.push({ code: "invalid_dates", message: "The plan dates do not match its duration." });
  }
  for (const day of plan.days) {
    for (const slot of PLANNER_SLOT_KEYS) {
      if (day.slots?.[slot] && !normalizePlannerConfiguration(day.slots[slot])) {
        issues.push({ code: "invalid_configuration", message: `The ${slot} selection on ${day.date} is invalid.`, address: { date: day.date, slot } });
      }
    }
  }
  return { valid: issues.length === 0, issues };
}
