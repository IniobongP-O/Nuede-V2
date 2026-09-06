import { checkoutSubmissionSchema } from "@nuede/validation/checkout";

import { serializePlanForCheckout } from "../../planner/utils/plannerModel.js";

export const CHECKOUT_SOURCE = Object.freeze({ cart: "cart", mealPlan: "meal-plan" });
export const PAYMENT_METHODS = Object.freeze([
  Object.freeze({ id: "paystack", label: "Pay with Paystack", description: "Continue to Paystack to pay securely. We'll confirm your payment when you return." }),
  Object.freeze({ id: "whatsapp", label: "Continue on WhatsApp", description: "We'll save your order, then open WhatsApp so you can continue with our team." }),
]);

export function parseCheckoutSource(value) {
  return Object.values(CHECKOUT_SOURCE).includes(value) ? value : null;
}

function asSafeKobo(value) {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isSafeInteger(numeric) || numeric < 0) throw new TypeError("Delivery fees must be non-negative integer kobo values.");
  return numeric;
}

export function normalizeDeliveryZone(row) {
  return Object.freeze({
    id: row.id,
    name: row.name,
    feeKobo: asSafeKobo(row.fee_kobo),
    sortOrder: Number(row.sort_order),
  });
}

export function normalizeCheckoutSettings(row) {
  return Object.freeze({
    paystackEnabled: row?.paystack_enabled === true,
    whatsappEnabled: row?.whatsapp_enabled === true,
  });
}

export function getEnabledPaymentMethods(settings) {
  if (!settings) return [];
  return PAYMENT_METHODS.filter((method) => settings[`${method.id}Enabled`] === true);
}

export function calculateEstimatedTotal(subtotalKobo, deliveryFeeKobo) {
  // Review totals are intentionally non-authoritative; the Edge Function reloads
  // the delivery fee and catalog prices before creating either kind of order.
  if (!Number.isSafeInteger(subtotalKobo) || subtotalKobo < 0 || !Number.isSafeInteger(deliveryFeeKobo) || deliveryFeeKobo < 0) return null;
  const totalKobo = subtotalKobo + deliveryFeeKobo;
  return Number.isSafeInteger(totalKobo) ? totalKobo : null;
}

function copyConfiguration(configuration) {
  return {
    productId: configuration.productId,
    variantId: configuration.variantId,
    addonIds: [...configuration.addonIds],
    quantity: configuration.quantity,
  };
}

export function buildCheckoutSubmission({ source, customer, deliveryZoneId, paymentMethod, cartItems = [], plan }) {
  const shared = {
    customer: {
      fullName: customer.fullName.trim(),
      phone: customer.phone.trim(),
      email: customer.email.trim(),
      address: customer.address.trim(),
      landmark: customer.landmark.trim(),
    },
    deliveryZoneId,
    paymentMethod,
  };
  // Only selections, schedule, and customer-entered delivery details cross the
  // client/server boundary. Display prices and product snapshots are excluded.
  const candidate = source === CHECKOUT_SOURCE.cart
    ? { orderType: "cart", ...shared, items: cartItems.map(copyConfiguration) }
    : { ...serializePlanForCheckout(plan), ...shared };
  return checkoutSubmissionSchema.parse(candidate);
}

export function getCheckoutReadiness({ source, sourcePending, sourceError, sourceEmpty, sourceIssues = [], zonesPending, zonesError, zone, settingsPending, settingsError, enabledMethods = [], paymentMethod }) {
  // Readiness is a UX guard, not authorization. The server repeats all mutable
  // catalog, delivery-zone, and payment-method checks at order creation time.
  const issues = [];
  if (!source) issues.push({ code: "invalid_source", message: "Choose whether to check out your basket or meal plan." });
  if (sourcePending) issues.push({ code: "source_loading", message: "Current meal details are still loading." });
  if (sourceError) issues.push({ code: "source_error", message: "Current meal details could not be checked." });
  if (sourceEmpty) issues.push({ code: "empty_source", message: source === CHECKOUT_SOURCE.cart ? "Your basket is empty." : "Your meal plan has no selected meals." });
  issues.push(...sourceIssues);
  if (zonesPending) issues.push({ code: "zones_loading", message: "Delivery areas are still loading." });
  if (zonesError) issues.push({ code: "zones_error", message: "Delivery areas could not be checked." });
  if (!zonesPending && !zonesError && !zone) issues.push({ code: "delivery_zone", message: "Choose an active delivery area." });
  if (settingsPending) issues.push({ code: "settings_loading", message: "Payment options are still loading." });
  if (settingsError) issues.push({ code: "settings_error", message: "Payment options could not be checked." });
  if (!settingsPending && !settingsError && enabledMethods.length === 0) issues.push({ code: "no_payment_methods", message: "Checkout is temporarily unavailable because no payment method is enabled." });
  if (paymentMethod && !enabledMethods.some((method) => method.id === paymentMethod)) issues.push({ code: "disabled_payment_method", message: "That payment method is no longer available. Choose another option." });
  if (!paymentMethod) issues.push({ code: "payment_method", message: "Choose a payment method." });
  return Object.freeze({ ready: issues.length === 0, issues: Object.freeze(issues) });
}
