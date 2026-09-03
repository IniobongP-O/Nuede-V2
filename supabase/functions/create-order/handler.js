import { corsHeaders } from "../_shared/cors.js";
import { createAuthoritativeOrder } from "../_shared/order/engine.js";
import { OrderError, publicErrorBody } from "../_shared/order/errors.js";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function handleCreateOrderRequest(request, { client, logger = console, createOrder = createAuthoritativeOrder } = {}) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") {
    return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST to create an order." } }, 405);
  }

  let candidate;
  try {
    candidate = await request.json();
  } catch {
    return json({ error: { code: "INVALID_JSON", message: "Send a valid JSON request body." } }, 400);
  }

  try {
    const order = await createOrder(candidate, client);
    return json({ order }, 201);
  } catch (error) {
    const safeError = error instanceof OrderError ? error : null;
    logger.error("Order creation failed", {
      code: safeError?.code || "ORDER_CREATION_FAILED",
      stage: safeError?.stage || "unknown",
    });
    return json(publicErrorBody(error), safeError?.status || 500);
  }
}
