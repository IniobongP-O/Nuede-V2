export const PAYMENT_RESULT_STATES = Object.freeze({
  confirming: "confirming",
  successful: "successful",
  pending: "pending",
  failed: "failed",
});

export function isValidPaystackReference(value) {
  return typeof value === "string" && /^[A-Za-z0-9.=-]{6,100}$/.test(value);
}

export function paymentResultState({ reference, isPending, isError, payment }) {
  if (!isValidPaystackReference(reference) || isError) return PAYMENT_RESULT_STATES.failed;
  if (isPending || !payment || payment.status === "confirming") return PAYMENT_RESULT_STATES.confirming;
  if (payment.status === "paid") return PAYMENT_RESULT_STATES.successful;
  if (payment.status === "pending") return PAYMENT_RESULT_STATES.pending;
  return PAYMENT_RESULT_STATES.failed;
}
