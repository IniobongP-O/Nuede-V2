import { normalizeCartItems } from "@nuede/domain/cart";
import { cartItemStorageSchema, cartStorageSchema } from "@nuede/validation/cart";

export const CART_STORAGE_KEY = "nuede:v2:cart";
export const CART_STORAGE_VERSION = 1;

function browserStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

export function normalizeStoredCartItems(value) {
  const container = cartStorageSchema.safeParse(value);
  if (!container.success) return [];
  const validItems = container.data.items.flatMap((candidate) => {
    const parsed = cartItemStorageSchema.safeParse(candidate);
    return parsed.success ? [parsed.data] : [];
  });
  return normalizeCartItems(validItems);
}

export function parseCartItems(serialized) {
  if (serialized === null || serialized === undefined || serialized === "") return [];
  try {
    return normalizeStoredCartItems(JSON.parse(serialized));
  } catch {
    return [];
  }
}

export function getCartItems(storage) {
  const target = browserStorage(storage);
  if (!target) return [];
  try {
    return parseCartItems(target.getItem(CART_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function setCartItems(items, storage) {
  const target = browserStorage(storage);
  if (!target) return false;
  try {
    target.setItem(CART_STORAGE_KEY, JSON.stringify({ version: CART_STORAGE_VERSION, items: normalizeCartItems(items) }));
    return true;
  } catch {
    return false;
  }
}

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
