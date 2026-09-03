import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { paymentResultState } from "../apps/storefront/src/features/checkout/utils/paymentResultModel.js";
import { isSafePaystackAuthorizationUrl, redirectToPaystackCheckout } from "../apps/storefront/src/features/checkout/utils/paystackCheckout.js";
import { createAuthoritativeOrder } from "../supabase/functions/_shared/order/engine.js";
import { OrderError } from "../supabase/functions/_shared/order/errors.js";
import { initializePaystackTransaction } from "../supabase/functions/_shared/paystack/client.js";
import { buildPaidWhatsappHandoff, normalizePaymentResult, persistPaystackOrderAtomically } from "../supabase/functions/_shared/paystack/persistence.js";
import { signPaystackPayload } from "../supabase/functions/_shared/paystack/signature.js";
import { createPaystackCheckout, handleInitializePaystackRequest, PaystackInitializationError } from "../supabase/functions/initialize-paystack/handler.js";
import { handlePaystackWebhookRequest, processPaystackWebhook } from "../supabase/functions/paystack-webhook/handler.js";
import { handleVerifyPaystackPaymentRequest, verifyKnownPaystackPayment } from "../supabase/functions/verify-paystack-payment/handler.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8");
const reference = "NUE-1234567890abcdef";

function checkout(overrides = {}) {
  return {
    orderType: "cart",
    customer: { fullName: "Ada Okafor", phone: "08000000000", email: "ada@example.com", address: "14 Quiet Street, Abuja", landmark: "" },
    deliveryZoneId: "50000000-0000-4000-8000-000000000001",
    paymentMethod: "paystack",
    items: [{ productId: "20000000-0000-4000-8000-000000000001", variantId: null, addonIds: [], quantity: 1 }],
    ...overrides,
  };
}

function order(overrides = {}) {
  return {
    orderId: "70000000-0000-4000-8000-000000000001",
    orderReference: "NUE-001401",
    customer: { email: "ada@example.com" },
    totalKobo: 2_000_000,
    paymentStatus: "pending",
    fulfilmentStatus: "pending",
    ...overrides,
  };
}

function paymentRow(overrides = {}) {
  return {
    id: "80000000-0000-4000-8000-000000000001",
    order_id: "70000000-0000-4000-8000-000000000001",
    amount_kobo: 2_000_000,
    status: "pending",
    verification_status: "unverified",
    provider_reference: reference,
    failure_code: null,
    orders: { order_reference: "NUE-001401", payment_status: "pending", fulfilment_status: "pending", total_kobo: 2_000_000 },
    ...overrides,
  };
}

function providerTransaction(overrides = {}) {
  return { id: "4099260516", status: "success", reference, amount: 2_000_000, currency: "NGN", paid_at: "2026-09-03T12:00:00.000Z", ...overrides };
}

test("Cycle 14 initialization pins Paystack and uses the authoritative order amount", async () => {
  const events = [];
  const result = await createPaystackCheckout(checkout(), null, {
    secretKey: "test-secret",
    storefrontUrl: "http://localhost:5173/",
    createReference: () => reference,
    createOrder: async (_candidate, _client, options) => {
      events.push("order-engine");
      assert.equal(typeof options.persist, "function");
      return order();
    },
    initializeTransaction: async (input) => {
      events.push("provider");
      assert.deepEqual(input, { email: "ada@example.com", amountKobo: 2_000_000, reference, orderReference: "NUE-001401", storefrontUrl: "http://localhost:5173/" });
      return { authorization_url: "https://checkout.paystack.com/secure-code", reference, access_code: "secure-code" };
    },
  });
  assert.deepEqual(events, ["order-engine", "provider"]);
  assert.equal(result.amountKobo, 2_000_000);
  assert.equal(result.paymentStatus, "pending");
  assert.equal(result.fulfilmentStatus, "pending");
});

test("Cycle 14 rejects non-Paystack and disabled-method requests before provider initialization", async () => {
  let initialized = false;
  await assert.rejects(createPaystackCheckout(checkout({ paymentMethod: "whatsapp" }), null, { storefrontUrl: "http://localhost:5173/" }), (error) => error.code === "INVALID_PAYMENT_METHOD");
  await assert.rejects(createPaystackCheckout(checkout(), null, {
    storefrontUrl: "http://localhost:5173/",
    createOrder: async () => { throw new OrderError("PAYMENT_METHOD_DISABLED", "Disabled", { stage: "business_validation" }); },
    initializeTransaction: async () => { initialized = true; },
  }), (error) => error.code === "PAYMENT_METHOD_DISABLED");
  assert.equal(initialized, false);
});

test("Cycle 14 rejects missing Paystack email and browser-supplied totals before trusted work", async () => {
  let trustedWork = 0;
  const createOrder = async (candidate) => createAuthoritativeOrder(candidate, null, {
      loadContext: async () => { trustedWork += 1; return {}; },
      persist: async () => { trustedWork += 1; return {}; },
    });
  for (const candidate of [checkout({ customer: { ...checkout().customer, email: "" } }), checkout({ totalKobo: 100 })]) {
    await assert.rejects(createPaystackCheckout(candidate, null, { storefrontUrl: "http://localhost:5173/", createOrder }), (error) => error.code === "INVALID_REQUEST");
  }
  assert.equal(trustedWork, 0);
});

test("Cycle 14 atomic disabled-race response maps to a useful method error", async () => {
  const client = { rpc: async () => ({ data: null, error: { message: "PAYSTACK_DISABLED" } }) };
  await assert.rejects(persistPaystackOrderAtomically(client, { order: {}, items: [] }, reference), (error) => error.code === "PAYMENT_METHOD_DISABLED" && error.status === 422);
});

test("Cycle 14 records provider initialization failure and returns recoverable permanent-order details", async () => {
  const failed = [];
  await assert.rejects(createPaystackCheckout(checkout(), null, {
    storefrontUrl: "http://localhost:5173/",
    createReference: () => reference,
    createOrder: async () => order(),
    initializeTransaction: async () => { throw new OrderError("PAYSTACK_PROVIDER_ERROR", "Provider unavailable", { status: 502 }); },
    failAttempt: async (_client, paymentReference, code) => failed.push([paymentReference, code]),
  }), (error) => error instanceof PaystackInitializationError && error.order.orderReference === "NUE-001401" && error.order.paymentStatus === "pending");
  assert.deepEqual(failed, [[reference, "initialization_failed"]]);
});

test("Cycle 14 Paystack client sends backend amount/email/reference and rejects unsafe authorization URLs", async () => {
  let request;
  const result = await initializePaystackTransaction({ email: "ada@example.com", amountKobo: 2_000_000, reference, orderReference: "NUE-001401", storefrontUrl: "https://nuede.example/base/" }, {
    secretKey: "sk_test_not-real",
    fetchImpl: async (url, options) => {
      request = { url, options, body: JSON.parse(options.body) };
      return new Response(JSON.stringify({ status: true, data: { authorization_url: "https://checkout.paystack.com/abc", access_code: "abc", reference } }), { status: 200 });
    },
  });
  assert.equal(result.reference, reference);
  assert.equal(request.url, "https://api.paystack.co/transaction/initialize");
  assert.equal(request.body.amount, "2000000");
  assert.equal(request.body.email, "ada@example.com");
  assert.equal(request.body.callback_url, "https://nuede.example/base/payment");
  assert.match(request.options.headers.Authorization, /^Bearer /);
  await assert.rejects(initializePaystackTransaction({ email: "ada@example.com", amountKobo: 2_000_000, reference, orderReference: "NUE-001401", storefrontUrl: "https://nuede.example/" }, {
    secretKey: "secret",
    fetchImpl: async () => new Response(JSON.stringify({ status: true, data: { authorization_url: "https://evil.example/steal", access_code: "abc", reference } }), { status: 200 }),
  }), (error) => error.code === "PAYSTACK_PROVIDER_ERROR");
});

test("Cycle 14 storefront redirects only to Paystack hosted checkout", () => {
  const calls = [];
  assert.equal(isSafePaystackAuthorizationUrl("https://checkout.paystack.com/abc"), true);
  assert.equal(redirectToPaystackCheckout("https://checkout.paystack.com/abc", (url) => calls.push(url)), true);
  for (const unsafe of ["http://checkout.paystack.com/abc", "https://paystack.com/abc", "https://checkout.paystack.com.evil.test/abc", "javascript:alert(1)"]) {
    assert.equal(redirectToPaystackCheckout(unsafe, (url) => calls.push(url)), false);
  }
  assert.deepEqual(calls, ["https://checkout.paystack.com/abc"]);
});

test("Cycle 14 verifies the exact raw webhook body before reconciliation", async () => {
  const raw = JSON.stringify({ event: "charge.success", data: providerTransaction() });
  const signature = await signPaystackPayload(raw, "secret");
  const reconciled = [];
  const accepted = await processPaystackWebhook(raw, signature, null, { secretKey: "secret", reconcile: async (_client, transaction) => { reconciled.push(transaction); return { idempotent: false }; } });
  assert.equal(accepted.matched, true);
  assert.equal(reconciled.length, 1);
  await assert.rejects(processPaystackWebhook(`${raw} `, signature, null, { secretKey: "secret", reconcile: async () => { throw new Error("must not run"); } }), (error) => error.code === "INVALID_WEBHOOK_SIGNATURE");
});

test("Cycle 14 invalid webhook signatures make zero trusted mutations", async () => {
  let mutations = 0;
  const response = await handlePaystackWebhookRequest(new Request("http://local", { method: "POST", headers: { "x-paystack-signature": "0".repeat(128) }, body: JSON.stringify({ event: "charge.success", data: providerTransaction() }) }), {
    secretKey: "secret",
    logger: { error() {} },
    processWebhook: (raw, signature, client, options) => processPaystackWebhook(raw, signature, client, { ...options, reconcile: async () => { mutations += 1; } }),
  });
  assert.equal(response.status, 401);
  assert.equal(mutations, 0);
});

test("Cycle 14 webhook passes provider amount to atomic reconciliation and ignores unrelated events", async () => {
  const transaction = providerTransaction({ amount: 1_999_999 });
  let received;
  const valid = async () => true;
  await processPaystackWebhook(JSON.stringify({ event: "charge.success", data: transaction }), "signature", null, { verifySignature: valid, reconcile: async (_client, input) => { received = input; return { idempotent: false }; } });
  assert.equal(received.amount, 1_999_999);
  const ignored = await processPaystackWebhook(JSON.stringify({ event: "transfer.success", data: transaction }), "signature", null, { verifySignature: valid, reconcile: async () => { throw new Error("must not reconcile"); } });
  assert.equal(ignored.ignored, true);
});

test("Cycle 14 duplicate successful webhook reports the database no-op", async () => {
  const result = await processPaystackWebhook(JSON.stringify({ event: "charge.success", data: providerTransaction() }), "signature", null, {
    verifySignature: async () => true,
    reconcile: async () => ({ idempotent: true }),
  });
  assert.equal(result.idempotent, true);
});

test("Cycle 14 verification trusts stored terminal states and verifies pending states server-to-server", async () => {
  let providerCalls = 0;
  const paid = paymentRow({ status: "paid", verification_status: "verified", orders: { order_reference: "NUE-001401", payment_status: "paid", fulfilment_status: "pending", total_kobo: 2_000_000 } });
  const trusted = await verifyKnownPaystackPayment(reference, null, { loadPayment: async () => paid, verifyTransaction: async () => { providerCalls += 1; } });
  assert.equal(trusted.status, "paid");
  assert.equal(providerCalls, 0);

  let loads = 0;
  const verified = await verifyKnownPaystackPayment(reference, null, {
    loadPayment: async () => (++loads === 1 ? paymentRow() : paid),
    verifyTransaction: async () => { providerCalls += 1; return providerTransaction(); },
    reconcile: async (_client, transaction) => { assert.equal(transaction.amount, 2_000_000); },
  });
  assert.equal(verified.status, "paid");
  assert.equal(providerCalls, 1);
});

test("Cycle 14 provider outage maps a known pending attempt to confirming without marking it paid", async () => {
  const result = await verifyKnownPaystackPayment(reference, null, {
    loadPayment: async () => paymentRow(),
    verifyTransaction: async () => { throw new OrderError("PAYSTACK_PROVIDER_ERROR", "Offline", { status: 502 }); },
  });
  assert.equal(result.status, "confirming");
  assert.equal(result.paymentStatus, "pending");
});

test("Cycle 14 provider-reported failure remains unpaid and produces the failed result state", async () => {
  let loads = 0;
  const failedRow = paymentRow({ status: "failed", verification_status: "failed", orders: { order_reference: "NUE-001401", payment_status: "failed", fulfilment_status: "pending", total_kobo: 2_000_000 } });
  const result = await verifyKnownPaystackPayment(reference, null, {
    loadPayment: async () => (++loads === 1 ? paymentRow() : failedRow),
    verifyTransaction: async () => providerTransaction({ status: "failed", paid_at: null }),
    reconcile: async () => ({ status: "failed" }),
  });
  assert.equal(result.status, "failed");
  assert.equal(result.paymentStatus, "failed");
  assert.equal(result.fulfilmentStatus, "pending");
});

test("Cycle 14 result mapping never trusts redirect success parameters", () => {
  assert.equal(paymentResultState({ reference: "fake", isPending: false, isError: false, payment: { status: "paid" } }), "failed");
  assert.equal(paymentResultState({ reference, isPending: false, isError: false, payment: { status: "pending" }, redirectStatus: "success" }), "pending");
  assert.equal(paymentResultState({ reference, isPending: false, isError: false, payment: { status: "paid" } }), "successful");
  assert.equal(paymentResultState({ reference, isPending: false, isError: false, payment: { status: "failed" } }), "failed");
});

test("Cycle 14 paid WhatsApp handoff uses only trusted result data and is independent of checkout settings", () => {
  const result = normalizePaymentResult(paymentRow({ status: "paid", verification_status: "verified", orders: { order_reference: "NUE-001401", payment_status: "paid", fulfilment_status: "pending", total_kobo: 2_000_000 } }), { whatsappRecipient: "+2348000000000" });
  assert.match(result.whatsapp.message, /Nuede Order NUE-001401/);
  assert.match(result.whatsapp.message, /Paid amount: ₦20,000/);
  assert.match(result.whatsapp.message, /Payment status: Confirmed/);
  assert.equal(buildPaidWhatsappHandoff(result, ""), null);
});

test("Cycle 14 handlers validate method, JSON, reference, and safe response envelopes", async () => {
  assert.equal((await handleInitializePaystackRequest(new Request("http://local", { method: "OPTIONS" }))).status, 204);
  assert.equal((await handleInitializePaystackRequest(new Request("http://local", { method: "GET" }))).status, 405);
  assert.equal((await handleInitializePaystackRequest(new Request("http://local", { method: "POST", body: "{" }))).status, 400);
  assert.equal((await handleVerifyPaystackPaymentRequest(new Request("http://local", { method: "POST", body: JSON.stringify({ reference: "bad ref!" }) }))).status, 400);
  const unknown = await handleVerifyPaystackPaymentRequest(new Request("http://local", { method: "POST", body: JSON.stringify({ reference }) }), {
    logger: { error() {} },
    verifyPayment: async () => { throw new OrderError("PAYMENT_NOT_FOUND", "We could not find that payment.", { status: 404, stage: "payment_lookup" }); },
  });
  assert.equal(unknown.status, 404);
  assert.equal((await unknown.json()).error.code, "PAYMENT_NOT_FOUND");
});

test("Cycle 14 source keeps secrets/backend mutations out of storefront and fulfilment out of reconciliation", async () => {
  const storefront = await read("apps/storefront/src/pages/CheckoutPage.jsx");
  const paymentPage = await read("apps/storefront/src/pages/PaymentPage.jsx");
  const migration = await read("supabase/migrations/20260903000300_integrate_paystack_payments.sql");
  const webhook = await read("supabase/functions/paystack-webhook/handler.js");
  assert.doesNotMatch(`${storefront}\n${paymentPage}`, /PAYSTACK_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|\.from\(["']payments|paymentStatus\s*=\s*["']paid/);
  assert.match(migration, /for update/i);
  assert.match(migration, /payments_provider_transaction_unique_idx/);
  assert.doesNotMatch(migration, /set fulfilment_status/);
  assert.match(webhook, /request\.text\(\)/);
  assert.doesNotMatch(webhook, /request\.json\(\)/);
});
