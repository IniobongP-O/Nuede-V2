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
  return {
    calories: numberOrNull(source?.calories),
    proteinG: numberOrNull(source?.protein_g),
    carbohydratesG: numberOrNull(source?.carbohydrates_g),
    fatG: numberOrNull(source?.fat_g),
  };
}

export function hasCompleteNutrition(nutrition) {
  return [nutrition?.calories, nutrition?.proteinG, nutrition?.carbohydratesG, nutrition?.fatG]
    .every((value) => value !== null && value !== undefined);
}

function deriveGroupedStatus(product, variants) {
  if (product.status !== "available") return product.status;
  if (variants.some(isOrderableVariant)) return "available";
  if (variants.some((variant) => variant.status === "sold_out" && isPriced(variant))) return "sold_out";
  return "unavailable";
}

function representativeVariant(product, variants) {
  const defaultVariant = variants.find((variant) => variant.id === product.default_variant_id);
  return defaultVariant || variants.find(isOrderableVariant) || variants.find(isPriced) || variants[0] || null;
}

function groupedPrice(product, variants, menuStatus) {
  if (menuStatus === "price_pending") return { priceKobo: null, pricePrefix: "" };
  const defaultVariant = variants.find((variant) => variant.id === product.default_variant_id && isPriced(variant));
  if (!product.requires_variant_selection && defaultVariant) {
    return { priceKobo: koboOrNull(defaultVariant.price_kobo), pricePrefix: "" };
  }
  const candidates = variants
    .filter((variant) => variant.status !== "unavailable" && isPriced(variant))
    .map((variant) => koboOrNull(variant.price_kobo));
  return { priceKobo: candidates.length ? Math.min(...candidates) : null, pricePrefix: candidates.length ? "From " : "" };
}

export function normalizeMenuProduct(product, imageUrlForPath = () => "") {
  const variants = [...(product.product_variants || [])]
    .filter((variant) => visibleVariantStatuses.has(variant.status))
    .sort((left, right) => left.sort_order - right.sort_order || left.id.localeCompare(right.id));
  const grouped = product.product_type === "grouped";
  const previewVariant = grouped ? representativeVariant(product, variants) : null;
  const menuStatus = grouped ? deriveGroupedStatus(product, variants) : product.status;
  const price = grouped
    ? groupedPrice(product, variants, menuStatus)
    : { priceKobo: koboOrNull(product.price_kobo), pricePrefix: "" };
  const nutrition = normalizedNutrition(previewVariant || product);
  const imagePath = product.image_path || previewVariant?.image_path || null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || "",
    categoryId: product.category_id,
    categoryName: product.category?.name || "",
    productType: product.product_type,
    isGrouped: grouped,
    requiresVariantSelection: Boolean(product.requires_variant_selection),
    variants,
    variantCount: variants.length,
    orderableVariantCount: variants.filter(isOrderableVariant).length,
    menuStatus,
    isOrderable: menuStatus === "available" && price.priceKobo !== null && (!grouped || variants.some(isOrderableVariant)),
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
