import { supabase, supabaseConfigurationError } from "../../../lib/supabaseClient.js";
import { slugify } from "../../catalog/utils/catalogUtils.js";

const deliveryZoneFields = "id,name,slug,fee_kobo,is_active,sort_order,updated_at";

function requireSupabase() {
  if (!supabase) throw new Error(supabaseConfigurationError);
  return supabase;
}

function throwIfError(error, message) {
  if (error) throw new Error(message, { cause: error });
}

export async function listDeliveryZones() {
  const { data, error } = await requireSupabase().from("delivery_zones")
    .select(deliveryZoneFields)
    .order("sort_order").order("name");
  throwIfError(error, "Delivery settings could not be loaded.");
  return data || [];
}

async function uniqueDeliveryZoneSlug(name) {
  const base = slugify(name);
  const { data, error } = await requireSupabase().from("delivery_zones")
    .select("slug")
    .like("slug", `${base}%`);
  throwIfError(error, "The delivery area could not be created.");
  const used = new Set((data || []).map((row) => row.slug));
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export async function createDeliveryZone({ name, feeKobo, sortOrder }) {
  const slug = await uniqueDeliveryZoneSlug(name);
  const { data, error } = await requireSupabase().from("delivery_zones")
    .insert({ name: name.trim(), slug, fee_kobo: feeKobo, is_active: true, sort_order: sortOrder })
    .select(deliveryZoneFields).single();
  throwIfError(error, "The delivery area could not be created.");
  return data;
}

export async function updateDeliveryZone({ id, feeKobo, isActive }) {
  const { data, error } = await requireSupabase().from("delivery_zones")
    .update({ fee_kobo: feeKobo, is_active: isActive })
    .eq("id", id)
    .select(deliveryZoneFields).single();
  throwIfError(error, "The delivery area could not be updated.");
  return data;
}

export async function deleteDeliveryZone(id) {
  const { data, error } = await requireSupabase().from("delivery_zones")
    .delete()
    .eq("id", id)
    .select("id,name").single();
  throwIfError(error, "The delivery area could not be deleted.");
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
