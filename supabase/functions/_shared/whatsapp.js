import { formatKobo } from "../../../packages/domain/src/currency.js";

import { OrderError } from "./order/errors.js";

const SLOT_LABELS = Object.freeze({
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
});

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function handoffFailure(message, cause) {
  return new OrderError("WHATSAPP_HANDOFF_FAILED", message, {
    status: 500,
    stage: "whatsapp_handoff",
    cause,
  });
}

export function normalizeWhatsappRecipient(value) {
  const compact = typeof value === "string" ? value.trim().replace(/[\s()-]/g, "") : "";
  const digits = compact.startsWith("+") ? compact.slice(1) : compact;
  if (!/^[1-9]\d{7,14}$/.test(digits)) {
    throw new OrderError("WHATSAPP_CONFIGURATION_ERROR", "WhatsApp ordering is temporarily unavailable.", {
      status: 503,
      stage: "whatsapp_configuration",
    });
  }
  return digits;
}

function itemLabel(item) {
  return item.variantName ? `${item.productName} — ${item.variantName}` : item.productName;
}

function itemDetails(item, indent = "   ") {
  return [
    `${indent}Quantity: ${item.quantity}`,
    ...(item.addons.length ? [`${indent}Add-ons: ${item.addons.map((addon) => addon.addonName).join(", ")}`] : []),
  ];
}

function cartLines(order) {
  return [
    "Items",
    ...order.items.flatMap((item, index) => [
      `${index + 1}. ${itemLabel(item)}`,
      ...itemDetails(item),
    ]),
  ];
}

function formatScheduleDate(calendarDate) {
  const date = new Date(`${calendarDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw handoffFailure("The saved meal-plan schedule could not be formatted.");
  return dateFormatter.format(date);
}

function mealPlanLines(order) {
  if (!order.schedule?.days?.length) throw handoffFailure("The saved meal-plan schedule could not be formatted.");
  return [
    `Meal plan: ${order.schedule.durationDays} days`,
    "Schedule",
    ...order.schedule.days.flatMap((day) => {
      const slots = Object.entries(day.slots).flatMap(([slot, item]) => item ? [
        `${SLOT_LABELS[slot] || slot}: ${itemLabel(item)}`,
        ...itemDetails(item, "  "),
      ] : []);
      return [formatScheduleDate(day.date), ...(slots.length ? slots : ["No meals selected"])];
    }),
  ];
}

export function buildWhatsappMessage(order) {
  try {
    // Build exclusively from the authoritative response/snapshots. The customer
    // cannot substitute display totals or names in the generated handoff.
    const orderLines = order.orderType === "meal_plan" ? mealPlanLines(order) : cartLines(order);
    return [
      `Nuede Order ${order.orderReference}`,
      "",
      ...orderLines,
      "",
      "Delivery",
      `Name: ${order.customer.fullName}`,
      `Phone: ${order.customer.phone}`,
      `Address: ${order.delivery.address}`,
      ...(order.delivery.landmark ? [`Landmark: ${order.delivery.landmark}`] : []),
      `Area: ${order.delivery.zone.name}`,
      "",
      `Subtotal: ${formatKobo(order.subtotalKobo)}`,
      `Delivery fee: ${formatKobo(order.deliveryFeeKobo)}`,
      `Total: ${formatKobo(order.totalKobo)}`,
      "Payment status: Unpaid",
    ].join("\n");
  } catch (error) {
    if (error instanceof OrderError) throw error;
    throw handoffFailure("The saved order could not be prepared for WhatsApp.", error);
  }
}

export function buildWhatsappHandoff(order, recipient) {
  const normalizedRecipient = normalizeWhatsappRecipient(recipient);
  const message = buildWhatsappMessage(order);
  return {
    message,
    url: `https://wa.me/${normalizedRecipient}?text=${encodeURIComponent(message)}`,
  };
}
