import { supabase, supabaseConfigurationError } from "../../../lib/supabaseClient.js";
import { slugify } from "../utils/catalogUtils.js";

const productFields = [
  "id",
  "category_id",
  "product_type",
  "name",
  "slug",
  "description",
  "price_kobo",
  "calories",
  "protein_g",
  "carbohydrates_g",
  "fat_g",
  "status",
  "updated_at",
  "category:categories!products_category_fk(id,name,is_enabled)",
].join(",");

function requireSupabase() {
  if (!supabase) throw new Error(supabaseConfigurationError);
  return supabase;
}

function throwIfError(error) {
  if (error) throw error;
}

async function uniqueSlug(table, name, excludeId) {
  const client = requireSupabase();
  const base = slugify(name);
  let query = client.from(table).select("id,slug").like("slug", `${base}%`);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  throwIfError(error);
  const used = new Set(data.map((row) => row.slug));
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export async function listCategories() {
  const { data, error } = await requireSupabase()
    .from("categories")
    .select("id,name,slug,is_enabled,sort_order,updated_at")
    .order("sort_order")
    .order("name");
  throwIfError(error);
  return data;
}

export async function createCategory(values) {
  const slug = await uniqueSlug("categories", values.name);
  const { data, error } = await requireSupabase()
    .from("categories")
    .insert({ name: values.name.trim(), slug, sort_order: Number(values.sortOrder), is_enabled: true })
    .select("id,name,slug,is_enabled,sort_order,updated_at")
    .single();
  throwIfError(error);
  return data;
}

export async function updateCategory({ id, name, sortOrder }) {
  const slug = await uniqueSlug("categories", name, id);
  const { data, error } = await requireSupabase()
    .from("categories")
    .update({ name: name.trim(), slug, sort_order: Number(sortOrder) })
    .eq("id", id)
    .select("id,name,slug,is_enabled,sort_order,updated_at")
    .single();
  throwIfError(error);
  return data;
}

export async function setCategoryEnabled({ id, isEnabled }) {
  const { data, error } = await requireSupabase()
    .from("categories")
    .update({ is_enabled: isEnabled })
    .eq("id", id)
    .select("id,name,slug,is_enabled,sort_order,updated_at")
    .single();
  throwIfError(error);
  return data;
}

export async function listStandardProducts() {
  const { data, error } = await requireSupabase()
    .from("products")
    .select(productFields)
    .eq("product_type", "standard")
    .order("updated_at", { ascending: false });
  throwIfError(error);
  return data;
}

export async function createStandardProduct(record) {
  const slug = await uniqueSlug("products", record.name);
  const { data, error } = await requireSupabase()
    .from("products")
    .insert({ ...record, slug })
    .select(productFields)
    .single();
  throwIfError(error);
  return data;
}

export async function updateStandardProduct({ id, record }) {
  const slug = await uniqueSlug("products", record.name, id);
  const { data, error } = await requireSupabase()
    .from("products")
    .update({ ...record, slug })
    .eq("id", id)
    .eq("product_type", "standard")
    .select(productFields)
    .single();
  throwIfError(error);
  return data;
}

export async function updateProductStatus({ id, status }) {
  const { data, error } = await requireSupabase()
    .from("products")
    .update({ status })
    .eq("id", id)
    .eq("product_type", "standard")
    .select(productFields)
    .single();
  throwIfError(error);
  return data;
}
