import { formatKobo } from "@nuede/domain/currency";
import { humanizeOrderValue } from "@nuede/domain/orders";

export const BUSINESS_TIME_ZONE = "Africa/Lagos";
export const analyticsPresetOptions = Object.freeze([
  { value: "today", label: "Today", days: 1 },
  { value: "7d", label: "7 days", days: 7 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "90d", label: "90 days", days: 90 },
  { value: "custom", label: "Custom range", days: null },
]);

/** Extracts calendar parts in Nuede's reporting timezone. */
function datePartsInBusinessTimezone(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

/** Returns today's reporting date as timezone-independent YYYY-MM-DD text. */
export function businessDate(now = new Date()) {
  const { year, month, day } = datePartsInBusinessTimezone(now);
  return `${year}-${month}-${day}`;
}

/** Shifts a report date by a whole number of calendar days. */
export function shiftDate(dateText, days) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Resolves a supported reporting preset to inclusive from/to dates. */
export function rangeForPreset(preset, today = businessDate()) {
  const option = analyticsPresetOptions.find((item) => item.value === preset);
  if (!option || option.days === null) return null;
  return { from: shiftDate(today, -(option.days - 1)), to: today, preset };
}

/** Validates a custom analytics interval and returns its user-facing issue. */
export function validateCustomRange(from, to) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || "") || !/^\d{4}-\d{2}-\d{2}$/.test(to || "")) {
    return "Choose both a start and end date.";
  }
  if (from > to) return "Start date must be on or before end date.";
  return "";
}

/** Formats an analytics date without allowing browser timezone drift. */
export function formatAnalyticsDate(value, options = {}) {
  if (!value) return "Not recorded";
  const date = new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: options.short ? "short" : "long",
    ...(options.includeYear === false ? {} : { year: "numeric" }),
    timeZone: "UTC",
  }).format(date);
}

/** Produces the concise date-range label shown on analytics views. */
export function analyticsRangeLabel(range) {
  if (!range) return "Selected period";
  if (range.from === range.to) return formatAnalyticsDate(range.from);
  return `${formatAnalyticsDate(range.from, { short: true })} – ${formatAnalyticsDate(range.to, { short: true })}`;
}

/** Converts integer kobo to the numeric naira value expected by chart axes. */
export function chartMoneyValue(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

/** Formats a chart tooltip's integer-kobo value as currency. */
export function formatChartKobo(value) {
  return formatKobo(String(Math.round(Number(value) || 0)));
}

/** Maps analytics RPC failures to actionable admin-facing copy. */
export function analyticsErrorMessage(error) {
  const message = String(error?.message || "");
  if (/ADMIN_ACCESS_REQUIRED|permission denied|42501/i.test(message)) return "Your session is not authorized to access private sales analytics.";
  if (/INVALID_ANALYTICS_DATE_RANGE|22023/i.test(message)) return "That analytics date range is invalid. Check the dates and try again.";
  if (/Failed to fetch|network/i.test(message)) return "The network request failed. Check your connection and try again.";
  return "Sales analytics are temporarily unavailable. Source orders and payments were not changed.";
}

/** Builds the ordered summary-card definitions for one analytics response. */
export function analyticsMetricCards(data, range) {
  const summary = data?.summary || {};
  const detail = analyticsRangeLabel(range);
  return [
    { label: "Revenue", value: formatKobo(summary.revenue_kobo || "0"), detail },
    { label: "Paid orders", value: Number(summary.paid_orders || 0).toLocaleString("en-NG"), detail: "Distinct verified orders" },
    { label: "Average order value", value: formatKobo(summary.average_order_value_kobo || "0"), detail: "Revenue ÷ paid orders" },
    { label: "Items sold", value: Number(summary.items_sold || 0).toLocaleString("en-NG"), detail: "Top-level item quantities" },
  ];
}

/** Returns the highest-volume product, using revenue as the tie-breaker. */
export function getMostOrderedMeal(productSales) {
  if (!Array.isArray(productSales)) return null;
  const meals = productSales.filter((product) => Number.isFinite(Number(product?.quantity_sold)) && Number(product.quantity_sold) > 0);
  const rankedMeal = meals.find((product) => Number(product.quantity_rank) === 1);
  if (rankedMeal) return rankedMeal;

  return meals.reduce((best, product) => {
    if (!best) return product;
    const difference = Number(product.quantity_sold) - Number(best.quantity_sold)
      || chartMoneyValue(product.revenue_kobo) - chartMoneyValue(best.revenue_kobo)
      || String(best.product_name || "").localeCompare(String(product.product_name || ""), "en-NG");
    return difference > 0 ? product : best;
  }, null);
}

/** Converts stored payment-method codes to admin-facing labels. */
export function paymentMethodLabel(value) {
  return value === "paystack" ? "Paystack" : humanizeOrderValue(value);
}
