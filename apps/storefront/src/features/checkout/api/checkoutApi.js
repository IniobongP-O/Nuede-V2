import { supabase, supabaseConfigurationError } from "../../../lib/supabaseClient.js";
import { normalizeCheckoutSettings, normalizeDeliveryZone } from "../utils/checkoutModel.js";

function requireSupabase() {
  if (!supabase) throw new Error(supabaseConfigurationError);
  return supabase;
}

export async function getDeliveryZones() {
  const { data, error } = await requireSupabase().from("delivery_zones")
    .select("id,name,fee_kobo,sort_order")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error) throw new Error("Delivery areas could not be loaded.", { cause: error });
  return (data || []).map(normalizeDeliveryZone);
}

export async function getCheckoutSettings() {
  const { data, error } = await requireSupabase().from("checkout_payment_options")
    .select("paystack_enabled,whatsapp_enabled")
    .maybeSingle();
  if (error || !data) throw new Error("Checkout options could not be loaded.", { cause: error });
  return normalizeCheckoutSettings(data);
}

export class CheckoutApiError extends Error {
  constructor(message, { code = "ORDER_CREATION_FAILED", order = null, cause } = {}) {
    super(message, { cause });
    this.name = "CheckoutApiError";
    this.code = code;
    this.order = order;
  }
}

const customerErrorMessages = Object.freeze({
  PAYMENT_METHOD_DISABLED: "That payment method is no longer available. Please choose another option.",
  WHATSAPP_DISABLED: "WhatsApp ordering is not available right now. Please choose another payment method.",
  DELIVERY_ZONE_UNAVAILABLE: "That delivery area is no longer available. Please choose another area.",
  PRODUCT_NOT_AVAILABLE: "One of your meals is no longer available. Please review your selections.",
  INVALID_VARIANT: "One of your meal options has changed. Please choose it again.",
  VARIANT_NOT_AVAILABLE: "One of your meal options is no longer available. Please choose another option.",
  INVALID_ADDON: "One of your add-ons has changed. Please review your selections.",
  ADDON_NOT_AVAILABLE: "One of your add-ons is no longer available. Please choose another option.",
  ORDER_VALUE_OUT_OF_RANGE: "We couldn't calculate this order. Please review the quantities and try again.",
  PAYMENT_NOT_FOUND: "We couldn't find this payment. Please check that you're using your latest payment link.",
  INVALID_PAYMENT_REFERENCE: "This payment link is incomplete or no longer valid.",
});

function customerErrorMessage(code, fallback) {
  return customerErrorMessages[code] || fallback;
}

async function functionErrorBody(error) {
  // Supabase exposes non-2xx function bodies on the response context. Clone it so
  // reading structured recovery data does not consume another caller's stream.
  const response = error?.context;
  if (!response || typeof response.clone !== "function") return null;
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

export async function createWhatsappOrder(contract) {
  const { data, error } = await requireSupabase().functions.invoke("create-whatsapp-order", { body: contract });
  if (error) {
    const body = await functionErrorBody(error);
    // A network failure is ambiguous: the server may already have persisted the
    // order, so the message avoids encouraging an automatic duplicate retry.
    throw new CheckoutApiError(
      customerErrorMessage(body?.error?.code, "We couldn't confirm whether your order was saved. Please check your connection before trying again."),
      { code: body?.error?.code, order: body?.order || null, cause: error },
    );
  }
  if (!data?.order?.orderId || !data.order.orderReference || !data.order.whatsapp?.url || typeof data.order.whatsapp.message !== "string") {
    throw new CheckoutApiError("We couldn't finish setting up your order. Please keep this page open and contact us for help.");
  }
  return data.order;
}

export async function initializePaystackCheckout(contract) {
  const { data, error } = await requireSupabase().functions.invoke("initialize-paystack", { body: contract });
  if (error) {
    const body = await functionErrorBody(error);
    throw new CheckoutApiError(
      customerErrorMessage(body?.error?.code, "We couldn't open Paystack. Your payment isn't confirmed yet."),
      { code: body?.error?.code || "PAYSTACK_INITIALIZATION_FAILED", order: body?.order || null, cause: error },
    );
  }
  const payment = data?.payment;
  if (!payment?.orderReference || !payment.paymentReference || !payment.authorizationUrl || !Number.isSafeInteger(payment.amountKobo)) {
    throw new CheckoutApiError("We couldn't open Paystack. Your payment isn't confirmed yet.");
  }
  return payment;
}

export async function verifyPaystackPayment(reference) {
  // The reference is a lookup key only. The Edge Function verifies non-terminal
  // attempts with Paystack; this client response cannot mark an order paid.
  const { data, error } = await requireSupabase().functions.invoke("verify-paystack-payment", { body: { reference } });
  if (error) {
    const body = await functionErrorBody(error);
    throw new CheckoutApiError(customerErrorMessage(body?.error?.code, "We couldn't check your payment right now. Please try again."), {
      code: body?.error?.code || "PAYMENT_VERIFICATION_FAILED",
      cause: error,
    });
  }
  if (!data?.payment?.status || !data.payment.orderReference || !data.payment.paymentReference) {
    throw new CheckoutApiError("We couldn't check your payment right now. Please try again.");
  }
  return data.payment;
}
