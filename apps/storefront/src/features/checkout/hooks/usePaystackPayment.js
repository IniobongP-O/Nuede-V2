import { useQuery } from "@tanstack/react-query";

import { verifyPaystackPayment } from "../api/checkoutApi.js";
import { isValidPaystackReference } from "../utils/paymentResultModel.js";

export function usePaystackPayment(reference) {
  return useQuery({
    queryKey: ["storefront-checkout", "paystack-payment", reference],
    queryFn: () => verifyPaystackPayment(reference),
    enabled: isValidPaystackReference(reference),
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (["paid", "failed"].includes(status)) return false;
      return query.state.dataUpdateCount < 6 ? 3_000 : false;
    },
    refetchIntervalInBackground: false,
  });
}
