import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteOrder, getOrderByReference, getOrdersPage, updateFulfilmentStatus } from "../api/ordersApi.js";

export const ordersQueryKey = ["admin", "orders"];

export function useOrders(filters) {
  return useQuery({
    queryKey: [...ordersQueryKey, "list", filters],
    queryFn: () => getOrdersPage(filters),
    placeholderData: (previous) => previous,
    refetchInterval: 30_000,
  });
}

export function useOrder(orderReference) {
  return useQuery({
    queryKey: [...ordersQueryKey, "detail", orderReference],
    queryFn: () => getOrderByReference(orderReference),
    enabled: Boolean(orderReference),
    refetchInterval: 30_000,
  });
}

export function useUpdateFulfilmentStatus(orderReference) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFulfilmentStatus,
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...ordersQueryKey, "list"] }),
        queryClient.invalidateQueries({ queryKey: [...ordersQueryKey, "detail", orderReference] }),
      ]);
    },
  });
}

export function useDeleteOrder(orderReference) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: [...ordersQueryKey, "detail", orderReference] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...ordersQueryKey, "list"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "sales-analytics"] }),
      ]);
    },
  });
}
