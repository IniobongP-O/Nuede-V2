import {
  addCartItem,
  createCartItemKey,
  decrementCartItem,
  getCartItemCount,
  incrementCartItem,
  normalizeCartItems,
  removeCartItem,
  replaceCartItem,
  setCartItemQuantity,
} from "@nuede/domain/cart";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CartContext } from "./cartContext.js";
import {
  CART_STORAGE_KEY,
  clearCartItems as clearCartStorage,
  getCartItems,
  parseCartItems,
  setCartItems,
} from "../storage/cartStorage.js";

/** Owns canonical cart state, local persistence, cross-tab sync, and cart actions. */
export function CartProvider({ children }) {
  const deferredHydration = Boolean(globalThis.__NUEDE_PRERENDER_HYDRATION__);
  const [items, setItemsState] = useState(() => deferredHydration ? [] : getCartItems());
  const itemsRef = useRef(items);

  const replaceState = useCallback((nextItems) => {
    const normalized = normalizeCartItems(nextItems);
    itemsRef.current = normalized;
    setItemsState(normalized);
    return normalized;
  }, []);

  const commit = useCallback((nextItems) => {
    const normalized = replaceState(nextItems);
    return { items: normalized, persisted: setCartItems(normalized) };
  }, [replaceState]);

  useEffect(() => {
    if (deferredHydration) queueMicrotask(() => replaceState(getCartItems()));
    // The storage event synchronizes other tabs; same-tab writes update React
    // state through commit because browsers do not echo this event to the writer.
    /** Replaces local cart state when another browser tab updates storage. */
    function handleStorage(event) {
      if (event.key !== CART_STORAGE_KEY) return;
      replaceState(parseCartItems(event.newValue));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [deferredHydration, replaceState]);

  const addItem = useCallback((configuration) => {
    const key = createCartItemKey(configuration);
    if (!key) return { changed: false, merged: false, persisted: false };
    const current = itemsRef.current;
    // Identity excludes quantity, so an identical product/variant/add-on tuple
    // merges while a customization difference creates another line.
    const merged = current.some((item) => createCartItemKey(item) === key);
    const next = addCartItem(current, configuration);
    const changed = getCartItemCount(next) !== getCartItemCount(current);
    return { ...commit(next), changed, merged, key };
  }, [commit]);

  const removeItem = useCallback((key) => ({ ...commit(removeCartItem(itemsRef.current, key)), changed: true }), [commit]);
  const incrementItem = useCallback((key) => ({ ...commit(incrementCartItem(itemsRef.current, key)), changed: true }), [commit]);
  const decrementItem = useCallback((key) => ({ ...commit(decrementCartItem(itemsRef.current, key)), changed: true }), [commit]);
  const setItemQuantity = useCallback((key, quantity) => ({ ...commit(setCartItemQuantity(itemsRef.current, key, quantity)), changed: true }), [commit]);
  const replaceItem = useCallback((key, configuration) => ({ ...commit(replaceCartItem(itemsRef.current, key, configuration)), changed: true }), [commit]);
  const clearCart = useCallback(() => {
    const changed = itemsRef.current.length > 0;
    const result = clearCartStorage();
    replaceState([]);
    return { ...result, changed };
  }, [replaceState]);

  const value = useMemo(() => ({
    items,
    itemCount: getCartItemCount(items),
    addItem,
    removeItem,
    incrementItem,
    decrementItem,
    setItemQuantity,
    replaceItem,
    clearCart,
  }), [items, addItem, removeItem, incrementItem, decrementItem, setItemQuantity, replaceItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
