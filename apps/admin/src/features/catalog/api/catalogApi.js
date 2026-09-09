import { supabase, supabaseConfigurationError } from "../../../lib/supabaseClient.js";
import { uniqueSlugCandidate } from "@nuede/validation/catalog";
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

/** Returns the configured Supabase client or fails with the setup error. */
function requireSupabase() {
  if (!supabase) throw new Error(supabaseConfigurationError);
  return supabase;
}

/** Throws the original Supabase failure so callers retain its structured code. */
function throwIfError(error) {
  if (error) throw error;
}

/** Normalizes embedded catalog relationships and ordering for admin consumers. */
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

/** Finds a unique generated slug for new records. */
async function uniqueSlug(table, name, excludeId) {
  const client = requireSupabase();
  const base = slugify(name);
  let query = client.from(table).select("id,slug").like("slug", `${base}%`);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  throwIfError(error);
  let historicalSlugs = [];
  if (table === "products") {
    const { data: redirects, error: redirectError } = await client.from("product_slug_redirects").select("slug").like("slug", `${base}%`);
    throwIfError(redirectError);
    historicalSlugs = redirects.map((row) => row.slug);
  }
  return uniqueSlugCandidate(base, [...data.map((row) => row.slug), ...historicalSlugs]);
}

/** Reloads one product with the same relationships returned by catalog lists. */
async function readProduct(id) {
  const { data, error } = await requireSupabase().from("products").select(productFields).eq("id", id).single();
  throwIfError(error);
  return normalizeProduct(data);
}

/** Replaces a product's complete ordered add-on assignment set. */
async function replaceAssignments(productId, addonIds) {
  // The RPC replaces the exact compatible set atomically, avoiding a transient
  // partially updated assignment list from separate delete/insert requests.
  const { error } = await requireSupabase().rpc("replace_product_addon_assignments", {
    p_product_id: productId,
    p_addon_ids: addonIds,
  });
  throwIfError(error);
}

/** Coordinates product data, assignments, and image replacement for create/update. */
/**
 * Saves product fields, add-on assignments, and optional image changes.
 * Database mutations finish before obsolete Storage objects are removed.
 */
async function saveProduct({ id, record, addonIds = [], imageFile, previousImagePath, removeImage = false }) {
  const client = requireSupabase();
  const entityId = id || crypto.randomUUID();
  const existingProduct = id ? await readProduct(id) : null;
  const requestedSlug = record.slug?.trim();
  const slug = requestedSlug || existingProduct?.slug || await uniqueSlug("products", record.name, id);
  if (requestedSlug && requestedSlug !== existingProduct?.slug) {
    const [{ data: products, error: productError }, { data: redirects, error: redirectError }] = await Promise.all([
      client.from("products").select("id").eq("slug", requestedSlug).neq("id", id || entityId),
      client.from("product_slug_redirects").select("product_id").eq("slug", requestedSlug),
    ]);
    throwIfError(productError || redirectError);
    if (products.length || redirects.some((redirect) => redirect.product_id !== id)) {
      const error = new Error("That public URL slug is already in use."); error.code = "23505"; throw error;
    }
  }
  const productRecord = { ...record };
  delete productRecord.slug;
  const existingImagePath = id && previousImagePath === undefined
    ? existingProduct.image_path
    : previousImagePath;
  let uploadedPath;
  let productPersisted = false;
  if (imageFile) uploadedPath = await uploadCatalogImage({ file: imageFile, entityType: "product", entityId });
  const imagePath = uploadedPath || (removeImage ? null : existingImagePath || null);

  // Storage and PostgreSQL do not share a transaction. Track which side committed
  // so failure compensation never removes the only image of a persisted product.
  try {
    const query = id
      ? client.from("products").update({ ...productRecord, slug, image_path: imagePath }).eq("id", id).eq("product_type", record.product_type)
      : client.from("products").insert({ ...productRecord, id: entityId, slug, image_path: imagePath });
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
    if (productPersisted && existingImagePath && existingImagePath !== imagePath) {
      await removeCatalogImage(existingImagePath).catch(() => undefined);
    }
    throw error;
  }

  // Remove the old object only after its database reference has changed.
  if (existingImagePath && existingImagePath !== imagePath) {
    await removeCatalogImage(existingImagePath).catch(() => undefined);
  }
  return readProduct(entityId);
}

/** Lists catalog categories in configured display order. */
/** Lists enabled and disabled categories in configured display order. */
export async function listCategories() {
  const { data, error } = await requireSupabase().from("categories")
    .select("id,name,slug,is_enabled,sort_order,updated_at").order("sort_order").order("name");
  throwIfError(error);
  return data;
}

/** Validates and creates a new category with a unique slug. */
/** Creates a category after deriving a unique URL slug. */
export async function createCategory(values) {
  const slug = await uniqueSlug("categories", values.name);
  const { data, error } = await requireSupabase().from("categories")
    .insert({ name: values.name.trim(), slug, sort_order: Number(values.sortOrder), is_enabled: true })
    .select("id,name,slug,is_enabled,sort_order,updated_at").single();
  throwIfError(error);
  return data;
}

/** Updates a category's editable identity and ordering fields. */
/** Updates category identity and ordering fields. */
export async function updateCategory({ id, name, sortOrder }) {
  const slug = await uniqueSlug("categories", name, id);
  const { data, error } = await requireSupabase().from("categories")
    .update({ name: name.trim(), slug, sort_order: Number(sortOrder) }).eq("id", id)
    .select("id,name,slug,is_enabled,sort_order,updated_at").single();
  throwIfError(error);
  return data;
}

/** Enables or disables a category through the audited admin RPC. */
/** Enables or disables a category and its public catalog visibility. */
export async function setCategoryEnabled({ id, isEnabled }) {
  const { data, error } = await requireSupabase().from("categories")
    .update({ is_enabled: isEnabled }).eq("id", id)
    .select("id,name,slug,is_enabled,sort_order,updated_at").single();
  throwIfError(error);
  return data;
}

/** Lists all products with variants and add-on assignments for catalog administration. */
/** Lists all admin products with categories, variants, and add-on assignments. */
export async function listProducts() {
  const { data, error } = await requireSupabase().from("products").select(productFields)
    .order("updated_at", { ascending: false });
  throwIfError(error);
  return data.map(normalizeProduct);
}

/** Lists standard products for add-on administration choices. */
/** Returns standard products only for standard-product editor workflows. */
export async function listStandardProducts() {
  const products = await listProducts();
  return products.filter((product) => product.product_type === "standard");
}

/** Creates a standard product through the shared save workflow. */
/** Creates a standard product through the shared save pipeline. */
export function createStandardProduct(payload) {
  if (payload.record) return saveProduct(payload);
  return saveProduct({ record: payload, addonIds: [] });
}

/** Updates a standard product through the shared save workflow. */
/** Updates a standard product through the shared save pipeline. */
export function updateStandardProduct(payload) {
  return saveProduct(payload.record ? payload : { ...payload, addonIds: [] });
}

/** Creates or updates a grouped product through the shared save workflow. */
/** Creates or updates a grouped product through the shared save pipeline. */
export function saveGroupedProduct(payload) {
  return saveProduct(payload);
}

/** Changes product availability through the database's audited transition RPC. */
/** Changes a product's operational availability status. */
export async function updateProductStatus({ id, status }) {
  const { error } = await requireSupabase().from("products").update({ status }).eq("id", id).select("id").single();
  throwIfError(error);
  return readProduct(id);
}

/** Deletes an eligible product and then removes its no-longer-referenced image. */
/** Deletes a product through the audited RPC, then removes unreferenced images. */
export async function deleteProduct(product) {
  const imagePaths = [...new Set([
    product.image_path,
    ...(product.product_variants || []).map((variant) => variant.image_path),
  ].filter(Boolean))];
  const { data, error } = await requireSupabase().from("products").delete()
    .eq("id", product.id).select("id").single();
  throwIfError(error);

  // PostgreSQL deletion is authoritative. Storage cleanup follows the commit so
  // a transient object-store failure can never leave a live meal with no image.
  await Promise.allSettled(imagePaths.map((path) => removeCatalogImage(path)));
  return data;
}

/** Lists add-ons in stable name order. */
/** Lists all product add-ons in stable name order. */
export async function listAddons() {
  const { data, error } = await requireSupabase().from("product_addons").select(addonFields).order("name");
  throwIfError(error);
  return data;
}

/** Creates a catalog add-on from a validated database record. */
/** Creates a product add-on from a validated database record. */
export async function createAddon(record) {
  const { data, error } = await requireSupabase().from("product_addons").insert(record).select(addonFields).single();
  throwIfError(error);
  return data;
}

/** Updates one catalog add-on's editable fields. */
/** Updates one existing product add-on. */
export async function updateAddon({ id, record }) {
  const { data, error } = await requireSupabase().from("product_addons").update(record).eq("id", id)
    .select(addonFields).single();
  throwIfError(error);
  return data;
}

/** Deletes an add-on after database constraints confirm it is safe. */
/** Deletes an add-on when assignment/history constraints permit it. */
export async function deleteAddon(id) {
  const { data, error } = await requireSupabase().from("product_addons").delete().eq("id", id)
    .select(addonFields).single();
  throwIfError(error);
  return data;
}

/** Creates or updates a variant and coordinates optional image replacement. */
/** Creates or updates a variant and coordinates its optional image replacement. */
export async function saveVariant({ productId, id, record, imageFile, previousImagePath, removeImage = false }) {
  const client = requireSupabase();
  const variantId = id || crypto.randomUUID();
  let uploadedPath;
  if (imageFile) uploadedPath = await uploadCatalogImage({ file: imageFile, entityType: "variant", entityId: variantId });
  const imagePath = uploadedPath || (removeImage ? null : previousImagePath || null);
  try {
    const query = id
      ? client.from("product_variants").update({ ...record, image_path: imagePath }).eq("id", id).eq("product_id", productId)
      : client.from("product_variants").insert({ ...record, id: variantId, product_id: productId, image_path: imagePath });
    const { data, error } = await query
      .select("id,product_id,name,description,price_kobo,calories,protein_g,carbohydrates_g,fat_g,image_path,status,sort_order,updated_at").single();
    throwIfError(error);
    if (previousImagePath && imagePath !== previousImagePath) {
      await removeCatalogImage(previousImagePath).catch(() => undefined);
    }
    return data;
  } catch (error) {
    if (uploadedPath) await removeCatalogImage(uploadedPath).catch(() => undefined);
    throw error;
  }
}

/** Deletes a variant and removes its image only after the row deletion succeeds. */
/** Deletes a grouped variant and removes its image after the database mutation. */
export async function deleteVariant({ productId, variant }) {
  const { data, error } = await requireSupabase().from("product_variants").delete()
    .eq("id", variant.id).eq("product_id", productId).select("id").single();
  throwIfError(error);
  if (variant.image_path) await removeCatalogImage(variant.image_path).catch(() => undefined);
  return data;
}

/** Persists the complete variant order using the database's exact-set RPC. */
/** Applies the complete ordered variant ID set through the database RPC. */
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
