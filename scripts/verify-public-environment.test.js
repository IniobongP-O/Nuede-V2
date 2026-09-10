import assert from "node:assert/strict";
import test from "node:test";
import {
  getDeploymentEnvironment,
  mergePublicEnvironment,
  validatePublicEnvironment,
} from "./public-environment.js";

const validProductionEnvironment = Object.freeze({
  VITE_SUPABASE_URL: "https://test-project.supabase.co",
  VITE_SUPABASE_ANON_KEY: "public-anon-key-for-tests",
  VITE_PUBLIC_SITE_URL: "https://nuede-valid-test-domain.com",
});

test("public environment resolution overlays only VITE_ deployment values", () => {
  const resolved = mergePublicEnvironment(
    { VITE_PUBLIC_SITE_URL: "https://file-value.test", VITE_CONTACT_EMAIL: "hello@file.test", SERVER_SECRET: "file-secret" },
    { VITE_PUBLIC_SITE_URL: "https://process-value.test", VITE_GOOGLE_SITE_VERIFICATION: "token", SERVER_SECRET: "process-secret" },
  );
  assert.deepEqual(resolved, {
    VITE_PUBLIC_SITE_URL: "https://process-value.test",
    VITE_CONTACT_EMAIL: "hello@file.test",
    VITE_GOOGLE_SITE_VERIFICATION: "token",
  });
});

test("deployment classification uses VERCEL_ENV without inferring from deployment URLs", () => {
  assert.equal(getDeploymentEnvironment({ VERCEL_ENV: "production", VERCEL_URL: "preview.vercel.app" }), "production");
  assert.equal(getDeploymentEnvironment({ VERCEL_ENV: "preview", VERCEL_PROJECT_PRODUCTION_URL: "project.vercel.app" }), "preview");
  assert.equal(getDeploymentEnvironment({ VERCEL_URL: "preview.vercel.app" }), "local");
});

test("production canonical validation accepts and normalizes an HTTPS root origin", () => {
  const normalized = validatePublicEnvironment({
    ...validProductionEnvironment,
    VITE_PUBLIC_SITE_URL: "https://nuede-valid-test-domain.com/",
  }, { production: true });
  assert.equal(normalized.VITE_PUBLIC_SITE_URL, "https://nuede-valid-test-domain.com");
});

test("production canonical validation rejects missing, unsafe, and non-root values", () => {
  const rejectedValues = [
    undefined,
    "",
    "http://nuede-valid-test-domain.com",
    "http://localhost:5173",
    "https://localhost",
    "https://127.0.0.1",
    "https://example.com",
    "https://nuede-preview.vercel.app",
    "https://nuede-valid-test-domain.com/menu",
    "https://nuede-valid-test-domain.com?test=true",
    "https://nuede-valid-test-domain.com#section",
    "https://user:password@nuede-valid-test-domain.com",
  ];
  for (const value of rejectedValues) {
    const environment = { ...validProductionEnvironment };
    if (value === undefined) delete environment.VITE_PUBLIC_SITE_URL;
    else environment.VITE_PUBLIC_SITE_URL = value;
    assert.throws(
      () => validatePublicEnvironment(environment, { production: true }),
      /VITE_PUBLIC_SITE_URL.*storefront Vercel project's Production environment.*HTTPS root URL.*\*\.vercel\.app/,
    );
  }
});

test("development does not require a canonical URL while hosted previews do", () => {
  assert.doesNotThrow(() => validatePublicEnvironment({}));
  assert.throws(
    () => validatePublicEnvironment({}, { requireCanonical: true }),
    /VITE_PUBLIC_SITE_URL/,
  );
});
