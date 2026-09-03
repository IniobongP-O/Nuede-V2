import { corsHeaders } from "../_shared/cors.js";
import { createAuthoritativeOrder } from "../_shared/order/engine.js";
import { OrderError, publicErrorBody } from "../_shared/order/errors.js";
import { buildWhatsappHandoff, normalizeWhatsappRecipient } from "../_shared/whatsapp.js";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function whatsappMethodError() {
  return new OrderError("INVALID_PAYMENT_METHOD", "Use the WhatsApp checkout route only for WhatsApp orders.", {
    status: 422,
    stage: "payment_method",
  });
}

export class WhatsappHandoffError extends OrderError {
  constructor(order, cause) {
    super("WHATSAPP_HANDOFF_FAILED", "Your order was recorded, but WhatsApp could not be prepared. Keep your order reference for support.", {
      status: 500,
      stage: "whatsapp_handoff",
      cause,
    });
    this.order = {
      orderId: order.orderId,
      orderReference: order.orderReference,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      fulfilmentStatus: order.fulfilmentStatus,
      totalKobo: order.totalKobo,
    };
  }
}

export async function createWhatsappOrder(candidate, client, {
  recipient,
  createOrder = createAuthoritativeOrder,
  buildHandoff = buildWhatsappHandoff,
} = {}) {
  if (candidate?.paymentMethod !== "whatsapp") throw whatsappMethodError();

  const normalizedRecipient = normalizeWhatsappRecipient(recipient);
  let order;
  try {
    // WhatsApp is only a handoff channel. The permanent, server-priced order is
    // created first so closing or blocking WhatsApp cannot lose the transaction.
    order = await createOrder(candidate, client);
  } catch (error) {
    if (error instanceof OrderError && error.code === "PAYMENT_METHOD_DISABLED") {
      throw new OrderError("WHATSAPP_DISABLED", "WhatsApp ordering is not currently available.", {
        status: error.status,
        stage: error.stage,
        cause: error,
      });
    }
    throw error;
  }

  try {
    return { ...order, whatsapp: buildHandoff(order, normalizedRecipient) };
  } catch (error) {
    // Formatting failure occurs after persistence, so return a recoverable order
    // reference instead of pretending the entire operation rolled back.
    throw new WhatsappHandoffError(order, error);
  }
}

export async function handleCreateWhatsappOrderRequest(request, {
  client,
  recipient,
  logger = console,
  createOrder = createWhatsappOrder,
} = {}) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") {
    return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST to create a WhatsApp order." } }, 405);
  }

  let candidate;
  try {
    candidate = await request.json();
  } catch {
    return json({ error: { code: "INVALID_JSON", message: "Send a valid JSON request body." } }, 400);
  }

  try {
    const order = await createOrder(candidate, client, { recipient });
    return json({ order }, 201);
  } catch (error) {
    const safeError = error instanceof OrderError ? error : null;
    logger.error("WhatsApp order flow failed", {
      code: safeError?.code || "ORDER_CREATION_FAILED",
      stage: safeError?.stage || "unknown",
      ...(error instanceof WhatsappHandoffError ? { orderReference: error.order.orderReference } : {}),
    });
    return json({
      ...publicErrorBody(error),
      ...(error instanceof WhatsappHandoffError ? { order: error.order } : {}),
    }, safeError?.status || 500);
  }
}
