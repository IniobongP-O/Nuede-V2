import { supabase, supabaseConfigurationError } from "../../../lib/supabaseClient.js";
import { normalizeMenuProduct } from "../utils/menuModel.js";

export const catalogImageBucket = "product-images";

const publicProductStatuses = ["available", "sold_out", "price_pending", "unavailable"];
const menuProductFields = [
  "id", "category_id", "product_type", "name", "slug", "description", "price_kobo",
  "calories", "protein_g", "carbohydrates_g", "fat_g", "image_path", "status",
  "requires_variant_selection", "default_variant_id", "sort_order", "updated_at",
  "category:categories!inner(id,name,slug,is_enabled,sort_order)",
  "product_variants(id,product_id,name,description,price_kobo,calories,protein_g,carbohydrates_g,fat_g,image_path,status,sort_order,updated_at)",
].join(",");

function requireSupabase() {
  if (!supabase) throw new Error(supabaseConfigurationError);
  return supabase;
}

function throwIfError(error) {
  if (error) throw new Error("The live menu could not be loaded.", { cause: error });
}

export function getCatalogImageUrl(path) {
  if (!path) return "";
  return requireSupabase().storage.from(catalogImageBucket).getPublicUrl(path).data.publicUrl;
}

export async function getCategories() {
  const { data, error } = await requireSupabase()
    .from("categories")
    .select("id,name,slug,sort_order")
    .eq("is_enabled", true)
    .order("sort_order")
    .order("name");
  throwIfError(error);
  return data || [];
}

export async function getMenuProducts() {
  const { data, error } = await requireSupabase()
    .from("products")
    .select(menuProductFields)
    .in("status", publicProductStatuses)
    .order("sort_order")
    .order("name");
  throwIfError(error);
  return (data || []).map((row) => normalizeMenuProduct(row, getCatalogImageUrl));
}
