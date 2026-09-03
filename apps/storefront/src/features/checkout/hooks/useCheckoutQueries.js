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

export function useDeliveryZones(enabled = true) {
  return useQuery({ ...liveOptions, enabled, queryKey: checkoutQueryKeys.deliveryZones, queryFn: getDeliveryZones });
}

export function useCheckoutSettings(enabled = true) {
  return useQuery({ ...liveOptions, enabled, queryKey: checkoutQueryKeys.settings, queryFn: getCheckoutSettings });
}

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
