import { useContext } from "react";

import { AuthContext } from "../context/authContext.js";

/** Returns the authenticated admin context and enforces provider placement. */
export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return value;
}
