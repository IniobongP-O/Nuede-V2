import { normalizeCartItems } from "@nuede/domain/cart";
import { cartItemStorageSchema, cartStorageSchema } from "@nuede/validation/cart";

export const CART_STORAGE_KEY = "nuede:v2:cart";
export const CART_STORAGE_VERSION = 1;

/** Resolves an injected storage adapter or the browser's accessible localStorage. */
function browserStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

/** Validates untrusted stored entries and applies the domain's cart merge rules. */
export function normalizeStoredCartItems(value) {
  // localStorage is an anonymous convenience, not a catalog snapshot. Invalid
  // entries are discarded and valid entries are canonicalized/merged before use.
  const container = cartStorageSchema.safeParse(value);
  if (!container.success) return [];
  const validItems = container.data.items.flatMap((candidate) => {
    const parsed = cartItemStorageSchema.safeParse(candidate);
    return parsed.success ? [parsed.data] : [];
  });
  return normalizeCartItems(validItems);
}

/** Parses serialized cart data, falling back to an empty cart on corruption. */
export function parseCartItems(serialized) {
  if (serialized === null || serialized === undefined || serialized === "") return [];
  try {
    return normalizeStoredCartItems(JSON.parse(serialized));
  } catch {
    return [];
  }
}

/** Reads the current browser cart without exposing storage exceptions to the UI. */
export function getCartItems(storage) {
  const target = browserStorage(storage);
  if (!target) return [];
  try {
    return parseCartItems(target.getItem(CART_STORAGE_KEY));
  } catch {
    return [];
  }
}

/** Persists a canonical, versioned cart and reports whether the write succeeded. */
export function setCartItems(items, storage) {
  const target = browserStorage(storage);
  if (!target) return false;
  try {
    // Persist identifiers and quantities only. All mutable catalog and display
    // attributes are resolved from the live menu on every load.
    target.setItem(CART_STORAGE_KEY, JSON.stringify({ version: CART_STORAGE_VERSION, items: normalizeCartItems(items) }));
    return true;
  } catch {
    return false;
  }
}

/** Removes the stored cart and reports whether browser persistence was updated. */
export function clearCartItems(storage) {
  const target = browserStorage(storage);
  if (!target) return { items: [], persisted: false };
  try {
    target.removeItem(CART_STORAGE_KEY);
    return { items: [], persisted: true };
  } catch {
    return { items: [], persisted: false };
  }
}
