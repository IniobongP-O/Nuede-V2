export function isOrderableVariant(variant) {
  return variant?.status === "available"
    && Number.isSafeInteger(variant.price_kobo)
    && variant.price_kobo >= 0;
}

export function groupedProductOrderabilityMessage(product, variants = []) {
  if (product?.product_type !== "grouped" || product.status !== "available") return null;
  const belongsToGroup = (variant) => !product.id || variant?.product_id === product.id;
  if (!variants.some((variant) => belongsToGroup(variant) && isOrderableVariant(variant))) {
    return "A grouped meal needs at least one visible, available, priced variant before it can be made available.";
  }
  if (!product.requires_variant_selection) {
    const defaultVariant = variants.find((variant) => variant.id === product.default_variant_id);
    if (!belongsToGroup(defaultVariant) || !isOrderableVariant(defaultVariant)) {
      return "The configured default variant must belong to this group and remain available.";
    }
  }
  return null;
}

export function moveVariantIds(variants, variantId, direction) {
  const ordered = [...variants].sort((left, right) => left.sort_order - right.sort_order || left.id.localeCompare(right.id));
  const index = ordered.findIndex((variant) => variant.id === variantId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return ordered.map((variant) => variant.id);
  [ordered[index], ordered[targetIndex]] = [ordered[targetIndex], ordered[index]];
  return ordered.map((variant) => variant.id);
}
