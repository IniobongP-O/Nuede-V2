import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { containsBackendSecret, validatePublicEnvironment } from "./public-environment.js";
import { readRequestText } from "../supabase/functions/_shared/requestBody.js";
import { handleCreateOrderRequest } from "../supabase/functions/create-order/handler.js";
import { handleCreateWhatsappOrderRequest } from "../supabase/functions/create-whatsapp-order/handler.js";
import { handleInitializePaystackRequest } from "../supabase/functions/initialize-paystack/handler.js";
import { handleVerifyPaystackPaymentRequest } from "../supabase/functions/verify-paystack-payment/handler.js";
import { handlePaystackWebhookRequest } from "../supabase/functions/paystack-webhook/handler.js";
import { persistOrderAtomically } from "../supabase/functions/_shared/order/persistence.js";
import { verifyPaystackTransaction } from "../supabase/functions/_shared/paystack/client.js";

const logger = { error() {} };
for (const handler of [handleCreateOrderRequest, handleCreateWhatsappOrderRequest, handleInitializePaystackRequest, handleVerifyPaystackPaymentRequest]) {
  test(`Cycle 18 ${handler.name} rejects oversized JSON before commerce work`, async () => {
    const response = await handler(new Request("https://test.invalid", { method: "POST", body: JSON.stringify({ data: "x".repeat(128 * 1024) }) }), { logger });
    assert.equal(response.status, 413);
    assert.equal((await response.json()).error.code, "PAYLOAD_TOO_LARGE");
  });
}

test("Cycle 18 body limit counts actual stream bytes and preserves signed UTF-8 text", async () => {
  const text = '{ "message": "Rice ₦ ✓", "space": true }\n';
  assert.equal(await readRequestText(new Request("https://test.invalid", { method: "POST", body: text })), text);
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(10)); controller.enqueue(new Uint8Array(11)); controller.close(); } });
  await assert.rejects(readRequestText(new Request("https://test.invalid", { method: "POST", body, duplex: "half", headers: { "content-length": "1" } }), 20), { code: "PAYLOAD_TOO_LARGE" });
});

test("Cycle 18 oversized webhook cannot reach signature or database work", async () => {
  let calls = 0;
  const response = await handlePaystackWebhookRequest(new Request("https://test.invalid", { method: "POST", body: "x".repeat(1024 * 1024 + 1) }), { logger, processWebhook: () => { calls += 1; } });
  assert.equal(response.status, 413);
  assert.equal(calls, 0);
});

test("Cycle 18 payment-method race surfaces as a recoverable business rejection", async () => {
  await assert.rejects(persistOrderAtomically({ rpc: async () => ({ error: { message: "PAYMENT_METHOD_DISABLED" } }) }, { order: {}, items: [] }), { code: "PAYMENT_METHOD_DISABLED", status: 422 });
});

test("Cycle 18 Paystack timeout covers the response body as well as headers", async () => {
  const started = Date.now();
  await assert.rejects(verifyPaystackTransaction("NUE-timeout", {
    secretKey: "test-fixture", timeoutMs: 20,
    fetchImpl: async (_url, { signal }) => ({ ok: true, json: () => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true })) }),
  }), { code: "PAYSTACK_PROVIDER_ERROR" });
  assert.ok(Date.now() - started < 1000);
});

test("Cycle 18 build guard accepts allowlisted Nuede public variables", () => {
  assert.doesNotThrow(() => validatePublicEnvironment({
    VITE_SUPABASE_URL: "https://test-project.supabase.co",
    VITE_SUPABASE_ANON_KEY: "public-anon-key-for-tests",
    VITE_PUBLIC_SITE_URL: "https://www.nuede-test.ng",
    VITE_CONTACT_PHONE: "",
    VITE_CONTACT_WHATSAPP: "",
    VITE_CONTACT_EMAIL: "",
    VITE_CONTACT_INSTAGRAM: "",
    VITE_CONTACT_HOURS: "",
  }));
});

test("Cycle 18 build guard accepts Vercel public deployment metadata", () => {
  assert.doesNotThrow(() => validatePublicEnvironment({
    VITE_VERCEL_GIT_REPO_ID: "synthetic-repo-id",
    VITE_VERCEL_GIT_PROVIDER: "github",
    VITE_VERCEL_GIT_REPO_SLUG: "nuede-v2",
    VITE_VERCEL_ENV: "production",
    VITE_VERCEL_URL: "nuede.example.vercel.app",
  }));
});

test("Cycle 18 build guard rejects arbitrary unknown Vite variables", () => {
  for (const name of ["VITE_RANDOM_UNAPPROVED_VARIABLE", "VITE_DATABASE_PASSWORD", "VITE_INTERNAL_TOKEN"]) {
    assert.throws(
      () => validatePublicEnvironment({ [name]: "value" }),
      new RegExp(`Unsafe frontend environment variable: ${name}`),
    );
  }
});

test("Cycle 18 Vercel namespace does not bypass backend-secret detection", () => {
  const privateKey = ["-----BEGIN", "PRIVATE KEY-----\nsynthetic-test-data"].join(" ");
  assert.equal(containsBackendSecret(privateKey), true);
  assert.throws(
    () => validatePublicEnvironment({ VITE_VERCEL_FAKE_TEST: privateKey }),
    /Unsafe frontend environment variable: VITE_VERCEL_FAKE_TEST/,
  );
});

test("Cycle 18 service-role detection remains protected", () => {
  const serviceToken = `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from('{"role":"service_role"}').toString("base64url")}.synthetic`;
  assert.equal(containsBackendSecret(serviceToken), true);
  assert.throws(() => validatePublicEnvironment({ VITE_SUPABASE_ANON_KEY: serviceToken }), /Unsafe frontend/);
  assert.throws(() => validatePublicEnvironment({ VITE_VERCEL_FAKE_TEST: serviceToken }), /Unsafe frontend/);
});

test("Cycle 18 Paystack secret detection remains protected", () => {
  const paystackSecret = ["sk", "live", "a".repeat(30)].join("_");
  assert.equal(containsBackendSecret(paystackSecret), true);
  assert.throws(() => validatePublicEnvironment({ VITE_SUPABASE_ANON_KEY: paystackSecret }), /Unsafe frontend/);
  assert.throws(() => validatePublicEnvironment({ VITE_VERCEL_FAKE_TEST: paystackSecret }), /Unsafe frontend/);
  assert.throws(() => validatePublicEnvironment({ VITE_PAYSTACK_SECRET_KEY: "anything" }), /Unsafe frontend/);
});

test("Cycle 18 other backend-secret formats remain protected", () => {
  for (const value of [
    ["sb", "secret", "x".repeat(30)].join("_"),
    ["postgresql://test-user", "synthetic-password@db.example.invalid:5432/test"].join(":"),
  ]) {
    assert.equal(containsBackendSecret(value), true);
    assert.throws(() => validatePublicEnvironment({ VITE_VERCEL_FAKE_TEST: value }), /Unsafe frontend/);
  }
});

test("Cycle 18 production build guard rejects missing and placeholder Supabase configuration", () => {
  assert.throws(() => validatePublicEnvironment({}, { production: true }), /Production requires/);
  for (const url of [
    "http://test-project.supabase.co",
    "https://localhost:54321",
    "https://127.0.0.1:54321",
    "https://your-project.supabase.co",
    "not-a-url",
    "https://test-user:synthetic-password@test-project.supabase.co",
  ]) {
    assert.throws(() => validatePublicEnvironment({
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_ANON_KEY: "public-anon-key-for-tests",
    }, { production: true }), /Production requires the intended HTTPS Supabase URL/);
  }
  for (const key of ["", "your-public-key", "example-public-key", "placeholder-anon-key", "fixture-anon-key"]) {
    assert.throws(() => validatePublicEnvironment({
      VITE_SUPABASE_URL: "https://test-project.supabase.co",
      VITE_SUPABASE_ANON_KEY: key,
    }, { production: true }), /Production requires a Supabase public key/);
  }
});

test("Cycle 18 production build guard accepts valid public Supabase configuration", () => {
  assert.doesNotThrow(() => validatePublicEnvironment({
    VITE_SUPABASE_URL: "https://test-project.supabase.co",
    VITE_SUPABASE_ANON_KEY: "public-anon-key-for-tests",
    VITE_PUBLIC_SITE_URL: "https://www.nuede-test.ng",
    VITE_VERCEL_ENV: "production",
  }, { production: true }));
});

test("Cycle 18 app deployment contracts independently include SPA routing and privacy headers", async () => {
  for (const app of ["storefront", "admin"]) {
    const config = JSON.parse(await readFile(`apps/${app}/vercel.json`, "utf8"));
    assert.equal(config.framework, "vite");
    assert.equal(config.outputDirectory, "dist");
    assert.equal(config.buildCommand, "npm run build");
    if (app === "storefront") {
      assert.equal(config.cleanUrls, true);
      assert.equal(config.rewrites, undefined);
    } else {
      assert.ok(config.rewrites.some((rule) => rule.destination === "/index.html"));
    }
    const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]));
    assert.equal(headers["Referrer-Policy"], "no-referrer");
    assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
    assert.match(headers["Content-Security-Policy"], /script-src 'self';/);
  }
});
