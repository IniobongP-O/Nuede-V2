import { supabase, supabaseConfigurationError } from "../../../lib/supabaseClient.js";

function requireSupabase() {
  if (!supabase) throw new Error(supabaseConfigurationError);
  return supabase;
}

function throwIfError(error, message) {
  if (error) throw new Error(message, { cause: error });
}

export async function listDeliveryZones() {
  const { data, error } = await requireSupabase().from("delivery_zones")
    .select("id,name,slug,fee_kobo,is_active,sort_order,updated_at")
    .order("sort_order").order("name");
  throwIfError(error, "Delivery settings could not be loaded.");
  return data || [];
}

export async function updateDeliveryZone({ id, feeKobo, isActive }) {
  const { data, error } = await requireSupabase().from("delivery_zones")
    .update({ fee_kobo: feeKobo, is_active: isActive })
    .eq("id", id)
    .select("id,name,slug,fee_kobo,is_active,sort_order,updated_at").single();
  throwIfError(error, "The delivery area could not be updated.");
  return data;
}

export async function getAdminCheckoutSettings() {
  const { data, error } = await requireSupabase().from("checkout_settings")
    .select("paystack_enabled,whatsapp_enabled,updated_at,updated_by")
    .eq("id", true).single();
  throwIfError(error, "Checkout settings could not be loaded.");
  return data;
}

export async function updateAdminCheckoutSettings({ paystackEnabled, whatsappEnabled, updatedBy }) {
  const { data, error } = await requireSupabase().from("checkout_settings")
    .update({ paystack_enabled: paystackEnabled, whatsapp_enabled: whatsappEnabled, updated_by: updatedBy })
    .eq("id", true)
    .select("paystack_enabled,whatsapp_enabled,updated_at,updated_by").single();
  throwIfError(error, "Checkout settings could not be updated.");
  return data;
}
