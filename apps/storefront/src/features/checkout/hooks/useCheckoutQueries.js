import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "../../../lib/supabaseClient.js";
import { getCheckoutSettings, getDeliveryZones } from "../api/checkoutApi.js";

export const checkoutQueryKeys = Object.freeze({
  all: ["storefront-checkout"],
  deliveryZones: ["storefront-checkout", "delivery-zones"],
  settings: ["storefront-checkout", "settings"],
});

const liveOptions = {
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
};

/** Loads active delivery zones while allowing callers to defer the request. */
/** Provides the active delivery-zone query when checkout has a valid source. */
export function useDeliveryZones(enabled = true) {
  return useQuery({ ...liveOptions, enabled, queryKey: checkoutQueryKeys.deliveryZones, queryFn: getDeliveryZones });
}

/** Loads the currently enabled checkout methods. */
/** Provides the public payment availability settings query. */
export function useCheckoutSettings(enabled = true) {
  return useQuery({ ...liveOptions, enabled, queryKey: checkoutQueryKeys.settings, queryFn: getCheckoutSettings });
}

/** Refreshes delivery-zone queries when the database broadcasts a change. */
/** Subscribes to delivery-zone changes and refreshes checkout availability. */
export function useCheckoutRealtime(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !supabase) return undefined;
    const channel = supabase.channel("storefront-checkout-delivery")
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_zones" }, () => {
        void queryClient.invalidateQueries({ queryKey: checkoutQueryKeys.deliveryZones });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [enabled, queryClient]);
}
