import { createContext, useContext } from "react";

export const ToastContext = createContext(null);

/** Returns the storefront toast API and enforces provider placement. */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
