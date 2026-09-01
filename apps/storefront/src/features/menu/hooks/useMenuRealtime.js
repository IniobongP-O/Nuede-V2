import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "../../../lib/supabaseClient.js";
import { menuQueryKeys } from "./useMenu.js";

export function useMenuRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabase) return undefined;

    const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: menuQueryKeys.products });
    const invalidateCategories = () => Promise.all([
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.categories }),
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.products }),
    ]);
    const channel = supabase
      .channel("storefront-menu-catalog")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, invalidateProducts)
      .on("postgres_changes", { event: "*", schema: "public", table: "product_variants" }, invalidateProducts)
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, invalidateCategories)
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);
}
