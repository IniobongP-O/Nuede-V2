import { readRequestText } from "../_shared/requestBody.js";
import { OrderError, publicErrorBody } from "../_shared/order/errors.js";
import { reconcilePaystackPayment } from "../_shared/paystack/persistence.js";
import { paystackWebhookEnvelopeSchema, paystackWebhookSchema } from "../_shared/paystack/schema.js";
import { verifyPaystackSignature } from "../_shared/paystack/signature.js";

/** Serializes the minimal JSON response used by the provider webhook. */
function json(body, status) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** Verifies, validates, and idempotently reconciles one raw Paystack webhook. */
export async function processPaystackWebhook(rawPayload, signature, client, {
  secretKey,
  verifySignature = verifyPaystackSignature,
  reconcile = reconcilePaystackPayment,
} = {}) {
  // Verify the exact raw bytes before JSON parsing or any database access;
  // re-serialization would change the signed content and unauthenticated events
  // must never reach reconciliation.
  if (!await verifySignature(rawPayload, signature, secretKey)) {
    throw new OrderError("INVALID_WEBHOOK_SIGNATURE", "The webhook signature is invalid.", { status: 401, stage: "webhook_signature" });
  }

  let candidate;
  try {
    candidate = JSON.parse(rawPayload);
  } catch (error) {
    throw new OrderError("INVALID_WEBHOOK", "The webhook payload is invalid.", { status: 400, stage: "webhook_payload", cause: error });
  }
  const envelope = paystackWebhookEnvelopeSchema.safeParse(candidate);
  if (!envelope.success) throw new OrderError("INVALID_WEBHOOK", "The webhook payload is invalid.", { status: 400, stage: "webhook_payload" });
  // Acknowledge unrelated signed events so Paystack does not retry them, while
  // keeping the mutation surface limited to charge terminal states.
  if (!["charge.success", "charge.failed"].includes(envelope.data.event)) return { received: true, matched: false, ignored: true };
  const parsed = paystackWebhookSchema.safeParse(candidate);
  if (!parsed.success) throw new OrderError("INVALID_WEBHOOK", "The webhook payload is invalid.", { status: 400, stage: "webhook_payload" });

  const expectedStatus = parsed.data.event === "charge.success" ? "success" : "failed";
  if (parsed.data.data.status.toLowerCase() !== expectedStatus) {
    throw new OrderError("INVALID_WEBHOOK", "The webhook event and transaction status do not match.", { status: 400, stage: "webhook_payload" });
  }
  const result = await reconcile(client, parsed.data.data);
  return { received: true, matched: Boolean(result), idempotent: result?.idempotent === true };
}

/** Handles the provider webhook without enabling browser CORS semantics. */
export async function handlePaystackWebhookRequest(request, {
  client,
  secretKey,
  logger = console,
  processWebhook = processPaystackWebhook,
} = {}) {
  if (request.method !== "POST") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST for Paystack webhooks." } }, 405);
  const signature = request.headers.get("x-paystack-signature") || "";
  try {
    const rawPayload = await readRequestText(request, 1024 * 1024);
    return json(await processWebhook(rawPayload, signature, client, { secretKey }), 200);
  } catch (error) {
    const safeError = error instanceof OrderError ? error : null;
    logger.error("Paystack webhook rejected", { code: safeError?.code || "WEBHOOK_FAILED", stage: safeError?.stage || "unknown" });
    return json(publicErrorBody(error), safeError?.status || 500);
  }
}
