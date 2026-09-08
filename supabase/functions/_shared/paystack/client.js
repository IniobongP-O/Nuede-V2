import { OrderError } from "../order/errors.js";
import { paystackInitializeResponseSchema, paystackVerifyResponseSchema } from "./schema.js";

const PAYSTACK_API_URL = "https://api.paystack.co";

/** Wraps Paystack transport/protocol failures in a safe provider-stage error. */
function providerError(message, cause) {
  return new OrderError("PAYSTACK_PROVIDER_ERROR", message, { status: 502, stage: "paystack_provider", cause });
}

/** Performs a bounded authenticated Paystack API request and validates base success. */
async function paystackRequest(path, { secretKey, fetchImpl = fetch, method = "GET", body, timeoutMs = 12_000 } = {}) {
  // The secret is accepted only by this Edge-runtime module and is never part of
  // the Vite contract. A timeout bounds ambiguous provider/network failures.
  if (!secretKey) throw new OrderError("PAYSTACK_CONFIGURATION_ERROR", "Paystack is temporarily unavailable.", { status: 503, stage: "paystack_configuration" });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  let payload;
  try {
    response = await fetchImpl(`${PAYSTACK_API_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    payload = await response.json();
  } catch (error) {
    throw providerError("Paystack could not be reached. Please try again.", error);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok || payload?.status !== true) throw providerError("Paystack could not process the payment request.");
  return payload;
}

/** Generates a Nuede-namespaced, provider-safe payment reference. */
export function createPaystackReference(randomUUID = () => crypto.randomUUID()) {
  return `NUE-${randomUUID().replaceAll("-", "")}`;
}

/** Validates the configured storefront origin used for payment return URLs. */
export function normalizeStorefrontUrl(value) {
  try {
    const url = new URL(value);
    const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if ((url.protocol !== "https:" && !localHttp) || url.username || url.password) throw new Error("Unsupported storefront URL");
    return url;
  } catch (error) {
    throw new OrderError("PAYSTACK_CONFIGURATION_ERROR", "Paystack is temporarily unavailable.", { status: 503, stage: "paystack_configuration", cause: error });
  }
}

/** Initializes hosted checkout with the server-calculated amount and permanent order reference. */
export async function initializePaystackTransaction({ email, amountKobo, reference, orderReference, storefrontUrl }, dependencies = {}) {
  const baseUrl = normalizeStorefrontUrl(storefrontUrl);
  const callbackUrl = new URL("payment", baseUrl);
  const cancelUrl = new URL("checkout", baseUrl);
  // Paystack receives the server-calculated integer-kobo amount and permanent
  // order reference. Neither value is copied from a browser subtotal.
  const payload = await paystackRequest("/transaction/initialize", {
    ...dependencies,
    method: "POST",
    body: {
      email,
      amount: String(amountKobo),
      currency: "NGN",
      reference,
      callback_url: callbackUrl.toString(),
      metadata: JSON.stringify({ order_reference: orderReference, cancel_action: cancelUrl.toString() }),
    },
  });
  const parsed = paystackInitializeResponseSchema.safeParse(payload);
  if (!parsed.success || parsed.data.data.reference !== reference) throw providerError("Paystack returned an invalid transaction response.");
  // Only Paystack's HTTPS hosted checkout is returned to the browser; validating
  // the host prevents a malformed provider response becoming an open redirect.
  const authorizationUrl = new URL(parsed.data.data.authorization_url);
  if (authorizationUrl.protocol !== "https:" || authorizationUrl.hostname !== "checkout.paystack.com") {
    throw providerError("Paystack returned an invalid checkout address.");
  }
  return parsed.data.data;
}

/** Loads and schema-validates Paystack's current transaction for one exact reference. */
export async function verifyPaystackTransaction(reference, dependencies = {}) {
  const payload = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`, dependencies);
  const parsed = paystackVerifyResponseSchema.safeParse(payload);
  if (!parsed.success || parsed.data.data.reference !== reference) throw providerError("Paystack returned an invalid verification response.");
  return parsed.data.data;
}
