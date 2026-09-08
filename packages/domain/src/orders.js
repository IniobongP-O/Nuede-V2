export const PAYMENT_STATUSES = Object.freeze(["unpaid", "pending", "paid", "failed", "refunded"]);
export const FULFILMENT_STATUSES = Object.freeze([
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);
export const PAYMENT_METHODS = Object.freeze(["paystack", "whatsapp"]);
export const ORDER_TYPES = Object.freeze(["cart", "meal_plan"]);

const nextFulfilmentStatus = Object.freeze({
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "out_for_delivery",
  out_for_delivery: "delivered",
});

// Dispatch, delivery, and cancellation are terminal operational boundaries.
const cancellableStatuses = new Set(["pending", "confirmed", "preparing", "ready"]);

/** Returns the single forward fulfilment step, or `null` at a terminal state. */
export function nextFulfilmentAction(current) {
  return nextFulfilmentStatus[current] || null;
}

/** Returns whether an order may still be cancelled operationally. */
export function canCancelFulfilment(current) {
  return cancellableStatuses.has(current);
}

/** Validates forward progress or a permitted cancellation in the order state machine. */
export function canTransitionFulfilmentStatus(current, next) {
  return nextFulfilmentStatus[current] === next || (next === "cancelled" && canCancelFulfilment(current));
}

/** Converts stored enum-style order values into labels suitable for the UI. */
export function humanizeOrderValue(value) {
  if (!value) return "Not available";
  if (value === "cart") return "Direct order";
  if (value === "meal_plan") return "Meal plan";
  if (value === "out_for_delivery") return "Out for delivery";
  if (value === "whatsapp") return "WhatsApp";
  if (value === "paystack") return "Paystack";
  const words = value.split("_");
  return [words[0][0].toUpperCase() + words[0].slice(1), ...words.slice(1)].join(" ");
}

/** Converts an untrusted page value to a positive page number, defaulting to one. */
export function normalizeOrdersPage(value) {
  const parsed = Number.parseInt(String(value || "1"), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

/** Reports whether any order-list filter is currently narrowing the result set. */
export function hasActiveOrderFilters(filters) {
  return Boolean(filters.search || filters.fulfilmentStatus || filters.paymentStatus || filters.paymentMethod || filters.orderType || filters.dateFrom || filters.dateTo);
}
