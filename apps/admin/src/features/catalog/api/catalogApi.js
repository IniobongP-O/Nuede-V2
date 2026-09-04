import { supabase, supabaseConfigurationError } from "../../../lib/supabaseClient.js";
import { slugify } from "../utils/catalogUtils.js";
import { removeCatalogImage, uploadCatalogImage } from "./imageApi.js";

const productFields = [
  "id", "category_id", "product_type", "name", "slug", "description", "price_kobo",
  "calories", "protein_g", "carbohydrates_g", "fat_g", "image_path", "status",
  "requires_variant_selection", "default_variant_id", "sort_order", "updated_at",
  "category:categories!products_category_fk(id,name,is_enabled)",
  "product_variants!product_variants_product_fk(id,product_id,name,description,price_kobo,calories,protein_g,carbohydrates_g,fat_g,image_path,status,sort_order,updated_at)",
  "product_addon_assignments(addon_id,sort_order)",
].join(",");

const addonFields = "id,name,price_kobo,calories,protein_g,carbohydrates_g,fat_g,is_available,updated_at";

function requireSupabase() {
  if (!supabase) throw new Error(supabaseConfigurationError);
  return supabase;
}

function throwIfError(error) {
  if (error) throw error;
}

function normalizeProduct(product) {
  if (!product) return product;
  return {
    ...product,
    product_variants: [...(product.product_variants || [])].sort(
      (left, right) => left.sort_order - right.sort_order || left.id.localeCompare(right.id),
    ),
    product_addon_assignments: [...(product.product_addon_assignments || [])].sort(
      (left, right) => left.sort_order - right.sort_order,
    ),
  };
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

async function readProduct(id) {
  const { data, error } = await requireSupabase().from("products").select(productFields).eq("id", id).single();
  throwIfError(error);
  return normalizeProduct(data);
}

async function replaceAssignments(productId, addonIds) {
  // The RPC replaces the exact compatible set atomically, avoiding a transient
  // partially updated assignment list from separate delete/insert requests.
  const { error } = await requireSupabase().rpc("replace_product_addon_assignments", {
    p_product_id: productId,
    p_addon_ids: addonIds,
  });
  throwIfError(error);
}

async function saveProduct({ id, record, addonIds = [], imageFile, previousImagePath }) {
  const client = requireSupabase();
  const entityId = id || crypto.randomUUID();
  const slug = await uniqueSlug("products", record.name, id);
  const existingImagePath = id && previousImagePath === undefined
    ? (await readProduct(id)).image_path
    : previousImagePath;
  let uploadedPath;
  let productPersisted = false;
  if (imageFile) uploadedPath = await uploadCatalogImage({ file: imageFile, entityType: "product", entityId });
  const imagePath = uploadedPath || existingImagePath || null;

  // Storage and PostgreSQL do not share a transaction. Track which side committed
  // so failure compensation never removes the only image of a persisted product.
  try {
    const query = id
      ? client.from("products").update({ ...record, slug, image_path: imagePath }).eq("id", id).eq("product_type", record.product_type)
      : client.from("products").insert({ ...record, id: entityId, slug, image_path: imagePath });
    const { error } = await query.select("id").single();
    throwIfError(error);
    productPersisted = true;
    await replaceAssignments(entityId, addonIds);
  } catch (error) {
    if (!id && productPersisted) {
      const { error: compensationError } = await client.from("products").delete().eq("id", entityId);
      if (!compensationError) productPersisted = false;
    }
    if (uploadedPath && !productPersisted) {
      await removeCatalogImage(uploadedPath).catch(() => undefined);
    }
    if (uploadedPath && productPersisted && existingImagePath && existingImagePath !== uploadedPath) {
      await removeCatalogImage(existingImagePath).catch(() => undefined);
    }
    throw error;
  }

  if (uploadedPath && existingImagePath && existingImagePath !== uploadedPath) {
    await removeCatalogImage(existingImagePath).catch(() => undefined);
  }
  return readProduct(entityId);
}

export async function listCategories() {
  const { data, error } = await requireSupabase().from("categories")
    .select("id,name,slug,is_enabled,sort_order,updated_at").order("sort_order").order("name");
  throwIfError(error);
  return data;
}

export async function createCategory(values) {
  const slug = await uniqueSlug("categories", values.name);
  const { data, error } = await requireSupabase().from("categories")
    .insert({ name: values.name.trim(), slug, sort_order: Number(values.sortOrder), is_enabled: true })
    .select("id,name,slug,is_enabled,sort_order,updated_at").single();
  throwIfError(error);
  return data;
}

export async function updateCategory({ id, name, sortOrder }) {
  const slug = await uniqueSlug("categories", name, id);
  const { data, error } = await requireSupabase().from("categories")
    .update({ name: name.trim(), slug, sort_order: Number(sortOrder) }).eq("id", id)
    .select("id,name,slug,is_enabled,sort_order,updated_at").single();
  throwIfError(error);
  return data;
}

export async function setCategoryEnabled({ id, isEnabled }) {
  const { data, error } = await requireSupabase().from("categories")
    .update({ is_enabled: isEnabled }).eq("id", id)
    .select("id,name,slug,is_enabled,sort_order,updated_at").single();
  throwIfError(error);
  return data;
}

export async function listProducts() {
  const { data, error } = await requireSupabase().from("products").select(productFields)
    .order("updated_at", { ascending: false });
  throwIfError(error);
  return data.map(normalizeProduct);
}

export async function listStandardProducts() {
  const products = await listProducts();
  return products.filter((product) => product.product_type === "standard");
}

export function createStandardProduct(payload) {
  if (payload.record) return saveProduct(payload);
  return saveProduct({ record: payload, addonIds: [] });
}

export function updateStandardProduct(payload) {
  return saveProduct(payload.record ? payload : { ...payload, addonIds: [] });
}

export function saveGroupedProduct(payload) {
  return saveProduct(payload);
}

export async function updateProductStatus({ id, status }) {
  const { error } = await requireSupabase().from("products").update({ status }).eq("id", id).select("id").single();
  throwIfError(error);
  return readProduct(id);
}

export async function listAddons() {
  const { data, error } = await requireSupabase().from("product_addons").select(addonFields).order("name");
  throwIfError(error);
  return data;
}

export async function createAddon(record) {
  const { data, error } = await requireSupabase().from("product_addons").insert(record).select(addonFields).single();
  throwIfError(error);
  return data;
}

export async function updateAddon({ id, record }) {
  const { data, error } = await requireSupabase().from("product_addons").update(record).eq("id", id)
    .select(addonFields).single();
  throwIfError(error);
  return data;
}

export async function deleteAddon(id) {
  const { data, error } = await requireSupabase().from("product_addons").delete().eq("id", id)
    .select(addonFields).single();
  throwIfError(error);
  return data;
}

export async function saveVariant({ productId, id, record, imageFile, previousImagePath }) {
  const client = requireSupabase();
  const variantId = id || crypto.randomUUID();
  let uploadedPath;
  if (imageFile) uploadedPath = await uploadCatalogImage({ file: imageFile, entityType: "variant", entityId: variantId });
  const imagePath = uploadedPath || previousImagePath || null;
  try {
    const query = id
      ? client.from("product_variants").update({ ...record, image_path: imagePath }).eq("id", id).eq("product_id", productId)
      : client.from("product_variants").insert({ ...record, id: variantId, product_id: productId, image_path: imagePath });
    const { data, error } = await query
      .select("id,product_id,name,description,price_kobo,calories,protein_g,carbohydrates_g,fat_g,image_path,status,sort_order,updated_at").single();
    throwIfError(error);
    if (uploadedPath && previousImagePath && uploadedPath !== previousImagePath) {
      await removeCatalogImage(previousImagePath).catch(() => undefined);
    }
    return data;
  } catch (error) {
    if (uploadedPath) await removeCatalogImage(uploadedPath).catch(() => undefined);
    throw error;
  }
}

export async function deleteVariant({ productId, variant }) {
  const { data, error } = await requireSupabase().from("product_variants").delete()
    .eq("id", variant.id).eq("product_id", productId).select("id").single();
  throwIfError(error);
  if (variant.image_path) await removeCatalogImage(variant.image_path).catch(() => undefined);
  return data;
}

export async function reorderVariants({ productId, variantIds }) {
  // The database validates the full stable child set and applies ordering in one
  // operation, preventing partial or cross-product reorders.
  const { error } = await requireSupabase().rpc("reorder_product_variants", {
    p_product_id: productId,
    p_variant_ids: variantIds,
  });
  throwIfError(error);
  return readProduct(productId);
}
