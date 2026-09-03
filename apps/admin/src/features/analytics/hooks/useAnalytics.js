import { useQuery } from "@tanstack/react-query";

import { getSalesAnalytics } from "../api/analyticsApi.js";

export const analyticsQueryKey = ["admin", "sales-analytics"];

export function useSalesAnalytics(range) {
  return useQuery({
    queryKey: [...analyticsQueryKey, range.from, range.to],
    queryFn: () => getSalesAnalytics(range),
    enabled: Boolean(range.from && range.to && range.from <= range.to),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

