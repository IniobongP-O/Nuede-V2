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

export function orderStatusTone(type, value) {
  return (type === "payment" ? paymentTones[value] : fulfilmentTones[value]) || "neutral";
}

export function orderErrorMessage(error, fallback = "Orders are temporarily unavailable. Please try again.") {
  const message = String(error?.message || "");
  if (/ADMIN_ACCESS_REQUIRED|permission denied|42501/i.test(message)) return "Your session is not authorized to access order operations.";
  if (/INVALID_FULFILMENT_TRANSITION/i.test(message)) return "This order changed or that fulfilment step is no longer valid. The latest order state has been loaded.";
  if (/ORDER_NOT_FOUND/i.test(message)) return "This order is no longer available.";
  if (/Failed to fetch|network/i.test(message)) return "The network request failed. Check your connection and try again.";
  return fallback;
}

export function formatOrderDate(value, options = {}) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: options.dateOnly ? "medium" : "medium",
    ...(options.dateOnly ? {} : { timeStyle: "short" }),
  }).format(date);
}

export function formatNutritionValue(value, unit) {
  return value === null || value === undefined ? "Unknown" : `${Number(value).toLocaleString("en-NG", { maximumFractionDigits: 2 })}${unit}`;
}

export function orderValueLabel(value) {
  return humanizeOrderValue(value);
}

export function pageCount(total, pageSize) {
  return Math.max(1, Math.ceil(total / pageSize));
}
