import { calculateItemNutrition } from "@nuede/domain/nutrition";
import { productConfigurationSchema } from "@nuede/validation/customization";

function isSafeKobo(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function issue(code, message, field = null) {
  return { code, message, field };
}

export function isVariantOrderableForProduct(product, variant) {
  return Boolean(
    product
    && variant
    && variant.productId === product.id
    && variant.status === "available"
    && variant.isOrderable !== false
    && isSafeKobo(variant.priceKobo),
  );
}

export function getVisibleVariants(product) {
  if (!product?.isGrouped) return [];
  return (product.variants || []).filter((variant) => variant.status !== "hidden");
}

export function getDefaultVariant(product) {
  if (!product?.isGrouped || product.requiresVariantSelection || !product.defaultVariantId) return null;
  const variant = getVisibleVariants(product).find((item) => item.id === product.defaultVariantId);
  return isVariantOrderableForProduct(product, variant) ? variant : null;
}

export function getCompatibleAddons(product) {
  return (product?.addons || []).filter((addon) => addon?.id);
}

export function isProductOrderable(product) {
  if (!product || product.status !== "available" || product.menuStatus !== "available") return false;
  if (product.isGrouped) return getVisibleVariants(product).some((variant) => isVariantOrderableForProduct(product, variant));
  return isSafeKobo(product.priceKobo);
}

function selectedBase(product, variantId) {
  if (!product) return null;
  if (!product.isGrouped) return product;
  return getVisibleVariants(product).find((variant) => variant.id === variantId) || null;
}

function selectedAddons(product, addonIds) {
  const selected = new Set(addonIds || []);
  return getCompatibleAddons(product).filter((addon) => selected.has(addon.id));
}

export function calculateConfiguredDisplayPrice(product, variantId, addonIds = [], quantity = 1) {
  const base = selectedBase(product, variantId);
  const addons = selectedAddons(product, addonIds);
  const componentPrices = [base?.priceKobo, ...addons.map((addon) => addon.priceKobo)];
  if (!Number.isSafeInteger(quantity) || quantity < 1 || componentPrices.some((value) => !isSafeKobo(value))) {
    return { unitPriceKobo: null, linePriceKobo: null, complete: false };
  }
  const unitPriceKobo = componentPrices.reduce((total, value) => total + value, 0);
  const linePriceKobo = unitPriceKobo * quantity;
  if (!Number.isSafeInteger(unitPriceKobo) || !Number.isSafeInteger(linePriceKobo)) {
    return { unitPriceKobo: null, linePriceKobo: null, complete: false };
  }
  return { unitPriceKobo, linePriceKobo, complete: true };
}

export function calculateConfiguredItemNutrition(product, variantId, addonIds = [], quantity = 1) {
  return calculateItemNutrition({
    product,
    variant: selectedBase(product, variantId),
    addons: selectedAddons(product, addonIds),
    quantity,
  });
}

export function validateProductConfiguration({ product, variantId = null, addonIds = [], quantity = 1 }) {
  const issues = [];
  if (!product?.id) {
    return { valid: false, issues: [issue("missing_product", "This meal is no longer available.", "productId")], configuration: null };
  }

  const configuration = {
    productId: product.id,
    variantId: variantId || null,
    addonIds: [...addonIds],
    quantity,
  };
  const structure = productConfigurationSchema.safeParse(configuration);
  if (!structure.success) {
    for (const schemaIssue of structure.error.issues) {
      const field = schemaIssue.path[0] || null;
      const duplicate = field === "addonIds" && schemaIssue.message.includes("unique");
      issues.push(issue(
        duplicate ? "duplicate_addon" : field === "quantity" ? "invalid_quantity" : "invalid_identity",
        duplicate ? "Remove the duplicate add-on selection." : field === "quantity" ? "Choose a whole quantity of at least 1." : "This meal selection contains an invalid catalog reference.",
        field,
      ));
    }
  }

  if (!isProductOrderable(product)) {
    const message = product.menuStatus === "price_pending"
      ? "This meal cannot be selected until its price is confirmed."
      : product.menuStatus === "sold_out" ? "This meal is currently sold out." : "This meal is not currently available.";
    issues.push(issue("product_not_orderable", message, "productId"));
  }

  if (product.isGrouped) {
    const variant = getVisibleVariants(product).find((item) => item.id === variantId);
    if (!variantId) {
      issues.push(issue("variant_required", "Choose an available meal option.", "variantId"));
    } else if (!variant) {
      issues.push(issue("invalid_variant", "Choose an option that belongs to this meal.", "variantId"));
    } else if (variant.productId !== product.id) {
      issues.push(issue("variant_product_mismatch", "Choose an option that belongs to this meal.", "variantId"));
    } else if (!isVariantOrderableForProduct(product, variant)) {
      issues.push(issue("variant_not_orderable", "That meal option is not currently available.", "variantId"));
    }
  } else if (variantId !== null) {
    issues.push(issue("unexpected_variant", "This meal does not use meal options.", "variantId"));
  }

  const compatibleById = new Map(getCompatibleAddons(product).map((addon) => [addon.id, addon]));
  for (const addonId of new Set(addonIds)) {
    const addon = compatibleById.get(addonId);
    if (!addon) issues.push(issue("incompatible_addon", "Remove an add-on that is not offered with this meal.", "addonIds"));
    else if (!addon.isAvailable || !isSafeKobo(addon.priceKobo)) issues.push(issue("addon_not_available", "Remove an add-on that is no longer available.", "addonIds"));
  }

  return { valid: issues.length === 0, issues, configuration: issues.length === 0 ? structure.data : null };
}

export function buildProductConfiguration(input) {
  const result = validateProductConfiguration(input);
  if (!result.valid) return result;
  return { ...result, configuration: Object.freeze({ ...result.configuration, addonIds: Object.freeze([...result.configuration.addonIds]) }) };
}
