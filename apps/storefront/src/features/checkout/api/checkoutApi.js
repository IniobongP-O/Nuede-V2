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

async function functionErrorBody(error) {
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
    throw new CheckoutApiError(
      body?.error?.message || "We couldn't confirm whether your order was recorded. Please check your connection before trying again.",
      { code: body?.error?.code, order: body?.order || null, cause: error },
    );
  }
  if (!data?.order?.orderId || !data.order.orderReference || !data.order.whatsapp?.url || typeof data.order.whatsapp.message !== "string") {
    throw new CheckoutApiError("The order response was incomplete. Please keep this page open and contact Nuede for help.");
  }
  return data.order;
}
