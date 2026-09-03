import { createCartItemKey } from "@nuede/domain/cart";
import { calculateCartNutrition, calculateNutrition } from "@nuede/domain/nutrition";

import {
  calculateConfiguredDisplayPrice,
  calculateConfiguredItemNutrition,
  validateProductConfiguration,
} from "../../product-detail/utils/customizationModel.js";

export const CART_ITEM_STATUS = Object.freeze({
  valid: "valid",
  stale: "stale",
  soldOut: "sold_out",
  pricePending: "price_pending",
  unavailable: "unavailable",
  invalidVariant: "invalid_variant",
  invalidAddon: "invalid_addon",
});

const statusDetails = Object.freeze({
  [CART_ITEM_STATUS.valid]: { label: "Available", message: "This configuration is available." },
  [CART_ITEM_STATUS.stale]: { label: "No longer available", message: "This item is no longer available." },
  [CART_ITEM_STATUS.soldOut]: { label: "Sold out", message: "This selection is currently sold out." },
  [CART_ITEM_STATUS.pricePending]: { label: "Price pending", message: "This selection cannot be ordered until its price is confirmed." },
  [CART_ITEM_STATUS.unavailable]: { label: "Unavailable", message: "This selection is not currently available." },
  [CART_ITEM_STATUS.invalidVariant]: { label: "Option unavailable", message: "The selected meal option is no longer available. Configure the meal again or remove it." },
  [CART_ITEM_STATUS.invalidAddon]: { label: "Add-on changed", message: "A selected add-on is unavailable or no longer offered with this meal. Configure the meal again or remove it." },
});

function unavailableNutrition() {
  return calculateNutrition([{}]);
}

function productStatus(product) {
  if (product.menuStatus === "price_pending") return CART_ITEM_STATUS.pricePending;
  if (product.menuStatus === "sold_out") return CART_ITEM_STATUS.soldOut;
  if (product.status !== "available" || product.menuStatus !== "available") return CART_ITEM_STATUS.unavailable;
  return CART_ITEM_STATUS.valid;
}

function resolveStatus(item, product, variant, selectedAddons, missingAddonIds) {
  const currentProductStatus = productStatus(product);
  if (currentProductStatus !== CART_ITEM_STATUS.valid) return currentProductStatus;
  if (product.isGrouped) {
    if (!variant || variant.productId !== product.id) return CART_ITEM_STATUS.invalidVariant;
    if (variant.status === "sold_out") return CART_ITEM_STATUS.soldOut;
    if (variant.priceKobo === null) return CART_ITEM_STATUS.pricePending;
    if (variant.status !== "available" || variant.isOrderable === false) return CART_ITEM_STATUS.invalidVariant;
  } else if (item.variantId !== null) {
    return CART_ITEM_STATUS.invalidVariant;
  }
  if (missingAddonIds.length || selectedAddons.some((addon) => !addon.isAvailable || addon.priceKobo === null)) {
    return CART_ITEM_STATUS.invalidAddon;
  }
  const validation = validateProductConfiguration({ product, ...item });
  return validation.valid ? CART_ITEM_STATUS.valid : CART_ITEM_STATUS.unavailable;
}

export function hydrateCartItem(item, publicProducts = []) {
  // Stored configurations are never trusted as current. Hydration resolves each
  // stable ID against the public catalog and keeps stale lines visible/removable
  // without leaking a deleted product's former details.
  const key = createCartItemKey(item);
  const product = publicProducts.find((candidate) => candidate.id === item.productId) || null;
  if (!product) {
    const details = statusDetails[CART_ITEM_STATUS.stale];
    return Object.freeze({
      key,
      configuration: item,
      product: null,
      variant: null,
      addons: Object.freeze([]),
      missingAddonIds: Object.freeze([...item.addonIds]),
      status: CART_ITEM_STATUS.stale,
      ...details,
      orderable: false,
      price: Object.freeze({ unitPriceKobo: null, linePriceKobo: null, complete: false }),
      nutrition: unavailableNutrition(),
    });
  }

  const variant = item.variantId ? product.variants.find((candidate) => candidate.id === item.variantId) || null : null;
  const addonsById = new Map(product.addons.map((addon) => [addon.id, addon]));
  const addons = item.addonIds.flatMap((id) => addonsById.get(id) || []);
  const missingAddonIds = item.addonIds.filter((id) => !addonsById.has(id));
  const status = resolveStatus(item, product, variant, addons, missingAddonIds);
  const rawPrice = calculateConfiguredDisplayPrice(product, item.variantId, item.addonIds, item.quantity);
  const price = missingAddonIds.length
    ? Object.freeze({ unitPriceKobo: null, linePriceKobo: null, complete: false })
    : Object.freeze(rawPrice);
  const knownNutrition = calculateConfiguredItemNutrition(product, item.variantId, item.addonIds, item.quantity);
  // A missing add-on makes the total incomplete even though known components can
  // still be displayed, so inject an unknown contribution instead of assuming 0.
  const nutrition = missingAddonIds.length ? calculateNutrition([knownNutrition, {}]) : knownNutrition;
  const details = statusDetails[status];

  return Object.freeze({
    key,
    configuration: item,
    product,
    variant,
    addons: Object.freeze(addons),
    missingAddonIds: Object.freeze(missingAddonIds),
    status,
    ...details,
    orderable: status === CART_ITEM_STATUS.valid,
    price,
    nutrition,
  });
}

export function hydrateCartItems(items = [], publicProducts = []) {
  return items.map((item) => hydrateCartItem(item, publicProducts));
}

export function calculateCartSubtotal(hydratedItems = []) {
  // This subtotal supports review UI only. Invalid lines are excluded and mark
  // the estimate incomplete; checkout independently reloads and prices on server.
  let subtotalKobo = 0;
  let includedLineCount = 0;
  for (const item of hydratedItems) {
    if (!item.orderable || !item.price.complete) continue;
    const next = subtotalKobo + item.price.linePriceKobo;
    if (!Number.isSafeInteger(next)) return Object.freeze({ subtotalKobo: null, complete: false, includedLineCount });
    subtotalKobo = next;
    includedLineCount += 1;
  }
  return Object.freeze({
    subtotalKobo,
    complete: includedLineCount === hydratedItems.length,
    includedLineCount,
  });
}

export function calculateHydratedCartNutrition(hydratedItems = []) {
  return calculateCartNutrition(hydratedItems.map((item) => item.nutrition));
}
