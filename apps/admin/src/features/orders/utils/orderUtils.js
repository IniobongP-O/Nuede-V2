import { humanizeOrderValue } from "@nuede/domain/orders";

export const orderFilterDefaults = Object.freeze({
  search: "",
  fulfilmentStatus: "",
  paymentStatus: "",
  paymentMethod: "",
  orderType: "",
  dateFrom: "",
  dateTo: "",
});

const paymentTones = { paid: "success", pending: "warning", unpaid: "warning", failed: "danger", refunded: "neutral" };
const fulfilmentTones = { pending: "warning", confirmed: "neutral", preparing: "warning", ready: "success", out_for_delivery: "success", delivered: "success", cancelled: "danger" };

/** Chooses the visual badge tone for a payment or fulfilment status. */
export function orderStatusTone(type, value) {
  return (type === "payment" ? paymentTones[value] : fulfilmentTones[value]) || "neutral";
}

/** Translates known order API failures to safe operational guidance. */
export function orderErrorMessage(error, fallback = "Orders are temporarily unavailable. Please try again.") {
  const message = String(error?.message || "");
  if (/PAYMENT_MANAGEMENT_ACCESS_REQUIRED/i.test(message)) return "Only an active owner or administrator can confirm WhatsApp payments.";
  if (/WHATSAPP_ORDER_REQUIRED/i.test(message)) return "Only WhatsApp orders can be marked as paid manually.";
  if (/INVALID_WHATSAPP_PAYMENT_TRANSITION/i.test(message)) return "This payment can no longer be marked as paid. The latest order state has been loaded.";
  if (/OWNER_ACCESS_REQUIRED/i.test(message)) return "Only an active owner can permanently delete orders.";
  if (/ORDER_DELETE_CONFIRMATION_MISMATCH/i.test(message)) return "The confirmation must exactly match the order reference.";
  if (/ADMIN_ACCESS_REQUIRED|permission denied|42501/i.test(message)) return "Your session is not authorized to access order operations.";
  if (/INVALID_FULFILMENT_TRANSITION/i.test(message)) return "This order changed or that fulfilment step is no longer valid. The latest order state has been loaded.";
  if (/ORDER_NOT_FOUND/i.test(message)) return "This order is no longer available.";
  if (/Failed to fetch|network/i.test(message)) return "The network request failed. Check your connection and try again.";
  return fallback;
}

/** Formats an order timestamp in the business locale and timezone. */
export function formatOrderDate(value, options = {}) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: options.dateOnly ? "medium" : "medium",
    ...(options.dateOnly ? {} : { timeStyle: "short" }),
  }).format(date);
}

/** Formats a nullable nutrition value with its display unit. */
export function formatNutritionValue(value, unit) {
  return value === null || value === undefined ? "Unknown" : `${Number(value).toLocaleString("en-NG", { maximumFractionDigits: 2 })}${unit}`;
}

/** Converts stored order enum values to human-readable labels. */
export function orderValueLabel(value) {
  return humanizeOrderValue(value);
}

/** Calculates the number of list pages for a total and page size. */
export function pageCount(total, pageSize) {
  return Math.max(1, Math.ceil(total / pageSize));
}
