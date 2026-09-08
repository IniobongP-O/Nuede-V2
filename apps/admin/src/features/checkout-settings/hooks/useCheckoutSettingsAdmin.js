import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createDeliveryZone, deleteDeliveryZone, getAdminCheckoutSettings, listDeliveryZones, updateAdminCheckoutSettings, updateDeliveryZone } from "../api/checkoutSettingsApi.js";

export const adminCheckoutQueryKeys = Object.freeze({
  all: ["admin-checkout-settings"],
  deliveryZones: ["admin-checkout-settings", "delivery-zones"],
  settings: ["admin-checkout-settings", "payment-methods"],
});

/** Provides all delivery zones for the management screen. */
export function useAdminDeliveryZones() {
  return useQuery({ queryKey: adminCheckoutQueryKeys.deliveryZones, queryFn: listDeliveryZones });
}

/** Provides the administrator-visible checkout payment settings. */
export function useAdminCheckoutSettings() {
  return useQuery({ queryKey: adminCheckoutQueryKeys.settings, queryFn: getAdminCheckoutSettings });
}

/** Creates a settings mutation and refreshes its query after success. */
function useSettingsMutation(mutationFn, queryKey) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
}

/** Creates the delivery-zone update mutation. */
export function useUpdateDeliveryZone() {
  return useSettingsMutation(updateDeliveryZone, adminCheckoutQueryKeys.deliveryZones);
}

/** Creates the delivery-zone creation mutation. */
export function useCreateDeliveryZone() {
  return useSettingsMutation(createDeliveryZone, adminCheckoutQueryKeys.deliveryZones);
}

/** Creates the delivery-zone deletion mutation. */
export function useDeleteDeliveryZone() {
  return useSettingsMutation(deleteDeliveryZone, adminCheckoutQueryKeys.deliveryZones);
}

/** Creates the checkout payment-settings update mutation. */
export function useUpdateAdminCheckoutSettings() {
  return useSettingsMutation(updateAdminCheckoutSettings, adminCheckoutQueryKeys.settings);
}
