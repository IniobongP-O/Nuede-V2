import { corsHeaders } from "../_shared/cors.js";
import { createAuthoritativeOrder } from "../_shared/order/engine.js";
import { OrderError, publicErrorBody } from "../_shared/order/errors.js";
import { createPaystackReference, initializePaystackTransaction, normalizeStorefrontUrl } from "../_shared/paystack/client.js";
import { failPaystackInitialization, persistPaystackOrderAtomically } from "../_shared/paystack/persistence.js";

function json(body, status) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function methodError() {
  return new OrderError("INVALID_PAYMENT_METHOD", "Use the Paystack checkout route only for Paystack orders.", { status: 422, stage: "payment_method" });
}

export class PaystackInitializationError extends OrderError {
  constructor(order, reference, cause, paymentStatus = "pending") {
    super(cause?.code || "PAYSTACK_INITIALIZATION_FAILED", cause?.message || "Paystack could not be initialized. Please try again.", {
      status: cause?.status || 502,
      stage: cause?.stage || "paystack_initialization",
      cause,
    });
    this.order = {
      orderId: order.orderId,
      orderReference: order.orderReference,
      paymentReference: reference,
      paymentMethod: "paystack",
      paymentStatus,
      fulfilmentStatus: order.fulfilmentStatus,
      totalKobo: order.totalKobo,
    };
  }
}

export async function createPaystackCheckout(candidate, client, {
  secretKey,
  storefrontUrl,
  createOrder = createAuthoritativeOrder,
  initializeTransaction = initializePaystackTransaction,
  createReference = createPaystackReference,
  persistAttempt = persistPaystackOrderAtomically,
  failAttempt = failPaystackInitialization,
} = {}) {
  if (candidate?.paymentMethod !== "paystack") throw methodError();
  normalizeStorefrontUrl(storefrontUrl);
  const reference = createReference();
  // Persist the authoritative order and pending attempt before the provider call.
  // If initialization fails, support still has a permanent reference to diagnose.
  const order = await createOrder(candidate, client, {
    persist: (trustedClient, snapshot) => persistAttempt(trustedClient, snapshot, reference),
  });

  try {
    const provider = await initializeTransaction({
      email: order.customer.email,
      amountKobo: order.totalKobo,
      reference,
      orderReference: order.orderReference,
      storefrontUrl,
    }, { secretKey });
    return {
      orderId: order.orderId,
      orderReference: order.orderReference,
      paymentReference: reference,
      authorizationUrl: provider.authorization_url,
      amountKobo: order.totalKobo,
      paymentStatus: "pending",
      fulfilmentStatus: order.fulfilmentStatus,
    };
  } catch (error) {
    try {
      // Recording provider failure must never downgrade an attempt that a racing
      // webhook has already verified as paid.
      await failAttempt(client, reference, "initialization_failed");
    } catch (reconciliationError) {
      throw new PaystackInitializationError(order, reference, reconciliationError);
    }
    throw new PaystackInitializationError(order, reference, error);
  }
}

export async function handleInitializePaystackRequest(request, {
  client,
  secretKey,
  storefrontUrl,
  logger = console,
  createCheckout = createPaystackCheckout,
} = {}) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST to initialize a payment." } }, 405);
  let candidate;
  try {
    candidate = await request.json();
  } catch {
    return json({ error: { code: "INVALID_JSON", message: "Send a valid JSON request body." } }, 400);
  }
  try {
    const payment = await createCheckout(candidate, client, { secretKey, storefrontUrl });
    return json({ payment }, 201);
  } catch (error) {
    const safeError = error instanceof OrderError ? error : null;
    logger.error("Paystack initialization failed", {
      code: safeError?.code || "PAYSTACK_INITIALIZATION_FAILED",
      stage: safeError?.stage || "unknown",
      ...(error instanceof PaystackInitializationError ? { orderReference: error.order.orderReference } : {}),
    });
    return json({
      ...publicErrorBody(error),
      ...(error instanceof PaystackInitializationError ? { order: error.order } : {}),
    }, safeError?.status || 500);
  }
}
