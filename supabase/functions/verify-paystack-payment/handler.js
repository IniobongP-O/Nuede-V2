import { corsHeaders } from "../_shared/cors.js";
import { OrderError, publicErrorBody } from "../_shared/order/errors.js";
import { loadPaystackPayment, normalizePaymentResult, reconcilePaystackPayment } from "../_shared/paystack/persistence.js";
import { paymentVerificationRequestSchema } from "../_shared/paystack/schema.js";
import { verifyPaystackTransaction } from "../_shared/paystack/client.js";

function json(body, status) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

export async function verifyKnownPaystackPayment(reference, client, {
  secretKey,
  whatsappRecipient,
  loadPayment = loadPaystackPayment,
  verifyTransaction = verifyPaystackTransaction,
  reconcile = reconcilePaystackPayment,
} = {}) {
  let payment = await loadPayment(client, reference);
  if (!payment) throw new OrderError("PAYMENT_NOT_FOUND", "We could not find that payment.", { status: 404, stage: "payment_lookup" });
  const current = normalizePaymentResult(payment, { whatsappRecipient });
  if (["paid", "failed"].includes(current.status)) return current;

  try {
    const transaction = await verifyTransaction(reference, { secretKey });
    await reconcile(client, transaction);
    payment = await loadPayment(client, reference);
    if (!payment) throw new OrderError("PAYMENT_NOT_FOUND", "We could not find that payment.", { status: 404, stage: "payment_lookup" });
    return normalizePaymentResult(payment, { whatsappRecipient });
  } catch (error) {
    if (error instanceof OrderError && error.code === "PAYSTACK_PROVIDER_ERROR") {
      return normalizePaymentResult(payment, { statusOverride: "confirming", whatsappRecipient });
    }
    throw error;
  }
}

export async function handleVerifyPaystackPaymentRequest(request, {
  client,
  secretKey,
  whatsappRecipient,
  logger = console,
  verifyPayment = verifyKnownPaystackPayment,
} = {}) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST to verify a payment." } }, 405);
  let candidate;
  try {
    candidate = await request.json();
  } catch {
    return json({ error: { code: "INVALID_JSON", message: "Send a valid JSON request body." } }, 400);
  }
  const parsed = paymentVerificationRequestSchema.safeParse(candidate);
  if (!parsed.success) return json({ error: { code: "INVALID_PAYMENT_REFERENCE", message: "Use a valid payment reference." } }, 400);
  try {
    return json({ payment: await verifyPayment(parsed.data.reference, client, { secretKey, whatsappRecipient }) }, 200);
  } catch (error) {
    const safeError = error instanceof OrderError ? error : null;
    logger.error("Paystack verification failed", { code: safeError?.code || "PAYMENT_VERIFICATION_FAILED", stage: safeError?.stage || "unknown" });
    return json(publicErrorBody(error), safeError?.status || 500);
  }
}
