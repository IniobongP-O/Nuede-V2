import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createDeliveryZone, deleteDeliveryZone, getAdminCheckoutSettings, listDeliveryZones, updateAdminCheckoutSettings, updateDeliveryZone } from "../api/checkoutSettingsApi.js";

export const adminCheckoutQueryKeys = Object.freeze({
  all: ["admin-checkout-settings"],
  deliveryZones: ["admin-checkout-settings", "delivery-zones"],
  settings: ["admin-checkout-settings", "payment-methods"],
});

export function useAdminDeliveryZones() {
  return useQuery({ queryKey: adminCheckoutQueryKeys.deliveryZones, queryFn: listDeliveryZones });
}

export function useAdminCheckoutSettings() {
  return useQuery({ queryKey: adminCheckoutQueryKeys.settings, queryFn: getAdminCheckoutSettings });
}

function useSettingsMutation(mutationFn, queryKey) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
}

export function useUpdateDeliveryZone() {
  return useSettingsMutation(updateDeliveryZone, adminCheckoutQueryKeys.deliveryZones);
}

export function useCreateDeliveryZone() {
  return useSettingsMutation(createDeliveryZone, adminCheckoutQueryKeys.deliveryZones);
}

export function useDeleteDeliveryZone() {
  return useSettingsMutation(deleteDeliveryZone, adminCheckoutQueryKeys.deliveryZones);
}

export function useUpdateAdminCheckoutSettings() {
  return useSettingsMutation(updateAdminCheckoutSettings, adminCheckoutQueryKeys.settings);
}
