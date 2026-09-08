import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "../../../lib/supabaseClient.js";
import { menuQueryKeys } from "./useMenu.js";
import { createCatalogInvalidator } from "../utils/catalogInvalidation.js";

/** Subscribes to catalog changes and invalidates the affected public queries. */
export function useMenuRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabase) return undefined;

    const invalidator = createCatalogInvalidator(queryClient, menuQueryKeys);
    const invalidateProducts = invalidator.products;
    const invalidateCategories = invalidator.categories;
    // Realtime is only an invalidation signal; refetching through the normal query
    // preserves normalization and RLS filtering when row visibility changes.
    const channel = supabase
      .channel("storefront-menu-catalog")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, invalidateProducts)
      .on("postgres_changes", { event: "*", schema: "public", table: "product_variants" }, invalidateProducts)
      .on("postgres_changes", { event: "*", schema: "public", table: "product_addons" }, invalidateProducts)
      .on("postgres_changes", { event: "*", schema: "public", table: "product_addon_assignments" }, invalidateProducts)
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, invalidateCategories)
      .subscribe();

    return () => { invalidator.cancel(); void supabase.removeChannel(channel); };
  }, [queryClient]);
}
