import { useQuery } from "@tanstack/react-query";

import { verifyPaystackPayment } from "../api/checkoutApi.js";
import { isValidPaystackReference } from "../utils/paymentResultModel.js";

/** Polls backend reconciliation for a valid Paystack reference until it is terminal. */
/** Polls backend reconciliation for a valid Paystack reference until terminal or capped. */
export function usePaystackPayment(reference) {
  return useQuery({
    queryKey: ["storefront-checkout", "paystack-payment", reference],
    queryFn: () => verifyPaystackPayment(reference),
    enabled: isValidPaystackReference(reference),
    retry: 1,
    refetchOnWindowFocus: true,
    // Poll only while reconciliation is non-terminal and cap attempts so a
    // provider outage does not create an unbounded background request loop.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (["paid", "failed"].includes(status)) return false;
      return query.state.dataUpdateCount < 6 ? 3_000 : false;
    },
    refetchIntervalInBackground: false,
  });
}
