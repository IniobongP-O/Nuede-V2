import { calculateNutrition, NUTRITION_STATUS } from "@nuede/domain/nutrition";

export const HIGH_PROTEIN_MINIMUM_GRAMS = 30;

const visibleVariantStatuses = new Set(["available", "sold_out", "unavailable"]);

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function koboOrNull(value) {
  const price = numberOrNull(value);
  return Number.isSafeInteger(price) && price >= 0 ? price : null;
}

function isPriced(variant) {
  return koboOrNull(variant?.price_kobo) !== null;
}

function isOrderableVariant(variant) {
  return variant?.status === "available" && isPriced(variant);
}

function normalizedNutrition(source) {
  return calculateNutrition([{
    calories: numberOrNull(source?.calories),
    proteinG: numberOrNull(source?.protein_g),
    carbohydratesG: numberOrNull(source?.carbohydrates_g),
    fatG: numberOrNull(source?.fat_g),
  }]);
}

function normalizeVariant(variant, imageUrlForPath) {
  const imagePath = variant.image_path || null;
  return {
    id: variant.id,
    productId: variant.product_id,
    name: variant.name,
    description: variant.description || "",
    priceKobo: koboOrNull(variant.price_kobo),
    nutrition: normalizedNutrition(variant),
    imagePath,
    imageUrl: imagePath ? imageUrlForPath(imagePath) : "",
    status: variant.status,
    isOrderable: isOrderableVariant(variant),
    sortOrder: variant.sort_order,
  };
}

function normalizeAddons(assignments) {
  return [...(assignments || [])]
    .sort((left, right) => left.sort_order - right.sort_order || left.addon_id.localeCompare(right.addon_id))
    .flatMap((assignment) => {
      const addon = assignment.addon;
      if (!addon) return [];
      return [{
        id: addon.id,
        name: addon.name,
        priceKobo: koboOrNull(addon.price_kobo),
        nutrition: normalizedNutrition(addon),
        isAvailable: addon.is_available === true,
        sortOrder: assignment.sort_order,
      }];
    });
}

export function hasCompleteNutrition(nutrition) {
  return calculateNutrition([nutrition]).status === NUTRITION_STATUS.complete;
}

function deriveGroupedStatus(product, variants) {
  // Group availability is derived from its children: an available parent is not
  // orderable when every currently public variant is sold out or unavailable.
  if (product.status !== "available") return product.status;
  if (variants.some(isOrderableVariant)) return "available";
  if (variants.some((variant) => variant.status === "sold_out" && isPriced(variant))) return "sold_out";
  return "unavailable";
}

function representativeVariant(product, variants) {
  // Cards need one preview only; prefer configured intent, then an orderable or
  // at least priced variant, while the detail view still exposes every option.
  const defaultVariant = variants.find((variant) => variant.id === product.default_variant_id);
  return defaultVariant || variants.find(isOrderableVariant) || variants.find(isPriced) || variants[0] || null;
}

function groupedPrice(product, variants, menuStatus) {
  if (menuStatus === "price_pending") return { priceKobo: null, pricePrefix: "" };
  const defaultVariant = variants.find((variant) => variant.id === product.default_variant_id && isPriced(variant));
  if (!product.requires_variant_selection && defaultVariant) {
    return { priceKobo: koboOrNull(defaultVariant.price_kobo), pricePrefix: "" };
  }
  // Required-selection groups display the lowest eligible price as "From"; this
  // remains an estimate until a concrete variant is selected and server-priced.
  const candidates = variants
    .filter((variant) => variant.status !== "unavailable" && isPriced(variant))
    .map((variant) => koboOrNull(variant.price_kobo));
  return { priceKobo: candidates.length ? Math.min(...candidates) : null, pricePrefix: candidates.length ? "From " : "" };
}

export function normalizeMenuProduct(product, imageUrlForPath = () => "") {
  const rawVariants = [...(product.product_variants || [])]
    .filter((variant) => visibleVariantStatuses.has(variant.status))
    .sort((left, right) => left.sort_order - right.sort_order || left.id.localeCompare(right.id));
  const grouped = product.product_type === "grouped";
  const previewVariant = grouped ? representativeVariant(product, rawVariants) : null;
  const menuStatus = grouped ? deriveGroupedStatus(product, rawVariants) : product.status;
  const price = grouped
    ? groupedPrice(product, rawVariants, menuStatus)
    : { priceKobo: koboOrNull(product.price_kobo), pricePrefix: "" };
  const nutrition = normalizedNutrition(previewVariant || product);
  const imagePath = product.image_path || previewVariant?.image_path || null;
  const variants = rawVariants.map((variant) => normalizeVariant(variant, imageUrlForPath));
  const addons = normalizeAddons(product.product_addon_assignments);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || "",
    categoryId: product.category_id,
    categoryName: product.category?.name || "",
    productType: product.product_type,
    isGrouped: grouped,
    status: product.status,
    requiresVariantSelection: Boolean(product.requires_variant_selection),
    defaultVariantId: product.default_variant_id || null,
    variants,
    addons,
    variantCount: variants.length,
    orderableVariantCount: variants.filter((variant) => variant.isOrderable).length,
    menuStatus,
    isOrderable: menuStatus === "available" && price.priceKobo !== null && (!grouped || variants.some((variant) => variant.isOrderable)),
    priceKobo: price.priceKobo,
    pricePrefix: price.pricePrefix,
    nutrition,
    hasCompleteNutrition: hasCompleteNutrition(nutrition),
    isHighProtein: nutrition.proteinG !== null && nutrition.proteinG >= HIGH_PROTEIN_MINIMUM_GRAMS,
    imagePath,
    imageUrl: imagePath ? imageUrlForPath(imagePath) : "",
    sortOrder: product.sort_order,
  };
}

export function filterMenuProducts(products, { search = "", categoryId = "all", filters = [] } = {}) {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const enabledFilters = new Set(filters);

  return products.filter((product) => {
    const searchableText = [product.name, product.description, product.categoryName].join(" ").toLocaleLowerCase();
    if (normalizedSearch && !searchableText.includes(normalizedSearch)) return false;
    if (categoryId !== "all" && product.categoryId !== categoryId) return false;
    if (enabledFilters.has("grouped") && !product.isGrouped) return false;
    if (enabledFilters.has("available") && !product.isOrderable) return false;
    if (enabledFilters.has("high-protein") && !product.isHighProtein) return false;
    if (enabledFilters.has("complete-nutrition") && !product.hasCompleteNutrition) return false;
    return true;
  });
}
