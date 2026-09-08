import { createContext, useContext } from "react";

export const CartContext = createContext(null);

/** Returns the cart API and enforces placement below `CartProvider`. */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
