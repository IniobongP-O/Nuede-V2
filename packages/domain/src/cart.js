/** Returns whether a value is a quantity the cart can safely accumulate. */
function positiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

/** Removes duplicate add-on IDs and returns them in a stable identity order. */
export function canonicalizeAddonIds(addonIds = []) {
  if (!Array.isArray(addonIds)) return [];
  return [...new Set(addonIds)].sort((left, right) => left.localeCompare(right));
}

/**
 * Reduces browser cart input to stable catalog identifiers and quantity.
 * Product details and prices are deliberately absent because persisted browser
 * state is untrusted and must be hydrated from the current catalog.
 */
export function normalizeCartConfiguration(configuration) {
  if (!configuration || typeof configuration !== "object") return null;
  const { productId, variantId = null, addonIds = [], quantity = 1 } = configuration;
  if (typeof productId !== "string" || !productId || (variantId !== null && (typeof variantId !== "string" || !variantId))) return null;
  if (!Array.isArray(addonIds) || addonIds.some((id) => typeof id !== "string" || !id) || !positiveSafeInteger(quantity)) return null;
  return Object.freeze({
    productId,
    variantId,
    addonIds: Object.freeze(canonicalizeAddonIds(addonIds)),
    quantity,
  });
}

/**
 * Creates the identity used for cart merging. Quantity is excluded so adding
 * the same product/variant/add-on tuple increases one line instead of creating
 * a visually duplicate line; any variant or add-on difference stays distinct.
 */
export function createCartItemKey(configuration) {
  const normalized = normalizeCartConfiguration({ ...configuration, quantity: 1 });
  if (!normalized) return null;
  return JSON.stringify([normalized.productId, normalized.variantId, normalized.addonIds]);
}

/** Compares two configurations by product, variant, and selected add-ons. */
export function isSameCartConfiguration(left, right) {
  const leftKey = createCartItemKey(left);
  return leftKey !== null && leftKey === createCartItemKey(right);
}

/**
 * Sanitizes a list of cart entries and merges entries with the same identity.
 * Invalid entries and quantity sums that exceed JavaScript's safe range are dropped.
 */
export function normalizeCartItems(items = []) {
  if (!Array.isArray(items)) return [];
  const merged = new Map();
  for (const item of items) {
    const normalized = normalizeCartConfiguration(item);
    const key = normalized && createCartItemKey(normalized);
    if (!normalized || !key) continue;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, normalized);
      continue;
    }
    const quantity = existing.quantity + normalized.quantity;
    if (!positiveSafeInteger(quantity)) continue;
    merged.set(key, Object.freeze({ ...existing, quantity }));
  }
  return [...merged.values()];
}

/** Adds a configuration and applies the cart's validation and merge rules. */
export function addCartItem(items, configuration) {
  return normalizeCartItems([...(Array.isArray(items) ? items : []), configuration]);
}

/** Removes every normalized cart line whose canonical identity matches `key`. */
export function removeCartItem(items, key) {
  return normalizeCartItems(items).filter((item) => createCartItemKey(item) !== key);
}

/** Replaces the quantity of one cart line when the new quantity is valid. */
export function setCartItemQuantity(items, key, quantity) {
  if (!positiveSafeInteger(quantity)) return normalizeCartItems(items);
  return normalizeCartItems(items).map((item) => (
    createCartItemKey(item) === key ? Object.freeze({ ...item, quantity }) : item
  ));
}

/** Increases one cart line by one without crossing the safe-integer boundary. */
export function incrementCartItem(items, key) {
  const item = normalizeCartItems(items).find((candidate) => createCartItemKey(candidate) === key);
  if (!item || !Number.isSafeInteger(item.quantity + 1)) return normalizeCartItems(items);
  return setCartItemQuantity(items, key, item.quantity + 1);
}

/** Decreases one cart line by one, keeping the minimum quantity at one. */
export function decrementCartItem(items, key) {
  const item = normalizeCartItems(items).find((candidate) => createCartItemKey(candidate) === key);
  if (!item || item.quantity <= 1) return normalizeCartItems(items);
  return setCartItemQuantity(items, key, item.quantity - 1);
}

/** Reconfigures one line and merges it if the new identity already exists. */
export function replaceCartItem(items, key, configuration) {
  // Removal followed by canonical addition also merges into an already-existing
  // line when the replacement configuration matches it.
  return addCartItem(removeCartItem(items, key), configuration);
}

/** Totals all valid quantities while protecting the result from overflow. */
export function getCartItemCount(items = []) {
  return normalizeCartItems(items).reduce((total, item) => {
    const next = total + item.quantity;
    return Number.isSafeInteger(next) ? next : total;
  }, 0);
}
