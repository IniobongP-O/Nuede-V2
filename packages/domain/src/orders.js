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

export function nextFulfilmentAction(current) {
  return nextFulfilmentStatus[current] || null;
}

export function canCancelFulfilment(current) {
  return cancellableStatuses.has(current);
}

export function canTransitionFulfilmentStatus(current, next) {
  return nextFulfilmentStatus[current] === next || (next === "cancelled" && canCancelFulfilment(current));
}

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

export function normalizeOrdersPage(value) {
  const parsed = Number.parseInt(String(value || "1"), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function hasActiveOrderFilters(filters) {
  return Boolean(filters.search || filters.fulfilmentStatus || filters.paymentStatus || filters.paymentMethod || filters.orderType || filters.dateFrom || filters.dateTo);
}
