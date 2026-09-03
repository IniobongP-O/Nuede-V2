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
