import assert from "node:assert/strict";
import test from "node:test";
import {
  getDeploymentEnvironment,
  mergePublicEnvironment,
  resolveCanonicalSiteUrl,
  resolveStorefrontEnvironment,
  validatePublicEnvironment,
  validateVercelProductionHostname,
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
  assert.equal(normalized.siteUrl, "https://nuede-valid-test-domain.com");
});

test("canonical resolution prefers an explicit custom domain over Vercel's project production URL", () => {
  assert.equal(resolveCanonicalSiteUrl({
    VITE_PUBLIC_SITE_URL: "https://www.nuede-test.com",
    VERCEL_ENV: "production",
    VERCEL_PROJECT_PRODUCTION_URL: "nuede-v2.vercel.app",
  }, { requireCanonical: true }), "https://www.nuede-test.com");
});

test("canonical resolution uses the stable Vercel production hostname in Production and Preview", () => {
  assert.equal(resolveCanonicalSiteUrl({
    VERCEL_ENV: "production",
    VERCEL_PROJECT_PRODUCTION_URL: "nuede-v2.vercel.app",
  }, { requireCanonical: true }), "https://nuede-v2.vercel.app");
  assert.equal(resolveCanonicalSiteUrl({
    VERCEL_ENV: "preview",
    VERCEL_PROJECT_PRODUCTION_URL: "nuede-v2.vercel.app",
    VERCEL_URL: "nuede-v2-feature-123.vercel.app",
    VERCEL_BRANCH_URL: "nuede-v2-git-feature.vercel.app",
  }, { requireCanonical: true }), "https://nuede-v2.vercel.app");
});

test("storefront environment resolution consumes Vercel system context without exposing it as public env", () => {
  const resolved = resolveStorefrontEnvironment({
    VITE_SUPABASE_URL: "https://test-project.supabase.co",
    VITE_SUPABASE_ANON_KEY: "public-anon-key-for-tests",
  }, {
    VERCEL_ENV: "production",
    VERCEL_PROJECT_PRODUCTION_URL: "nuede-v2.vercel.app",
    VERCEL_URL: "nuede-v2-deployment-123.vercel.app",
  });
  assert.equal(resolved.siteUrl, "https://nuede-v2.vercel.app");
  assert.equal(resolved.publicEnvironment.VERCEL_PROJECT_PRODUCTION_URL, undefined);
  assert.equal(resolved.publicEnvironment.VERCEL_URL, undefined);
});

test("an explicit Vercel canonical must exactly match the trusted project production hostname", () => {
  assert.equal(resolveCanonicalSiteUrl({
    VITE_PUBLIC_SITE_URL: "https://nuede-v2.vercel.app",
    VERCEL_ENV: "production",
    VERCEL_PROJECT_PRODUCTION_URL: "nuede-v2.vercel.app",
  }, { requireCanonical: true }), "https://nuede-v2.vercel.app");
  assert.throws(() => resolveCanonicalSiteUrl({
    VITE_PUBLIC_SITE_URL: "https://random-project.vercel.app",
    VERCEL_ENV: "production",
    VERCEL_PROJECT_PRODUCTION_URL: "nuede-v2.vercel.app",
  }, { requireCanonical: true }), /canonical production origin/);
  assert.throws(() => resolveCanonicalSiteUrl({
    VITE_PUBLIC_SITE_URL: "https://random-project.vercel.app",
  }, { requireCanonical: true }), /canonical production origin/);
});

test("production canonical validation rejects missing, unsafe, and non-root values", () => {
  const rejectedValues = [
    "",
    "http://nuede-valid-test-domain.com",
    "http://localhost:5173",
    "https://localhost",
    "https://127.0.0.1",
    "https://example.com",
    "https://nuede-preview.vercel.app",
    "https://nuede-preview.vercel.app.",
    "https://nuede-valid-test-domain.com/menu",
    "https://nuede-valid-test-domain.com?test=true",
    "https://nuede-valid-test-domain.com#section",
    "https://user:password@nuede-valid-test-domain.com",
  ];
  for (const value of rejectedValues) {
    const environment = { ...validProductionEnvironment, VITE_PUBLIC_SITE_URL: value };
    assert.throws(
      () => validatePublicEnvironment(environment, { production: true }),
      /canonical production origin.*VERCEL_PROJECT_PRODUCTION_URL.*VERCEL_URL.*VERCEL_BRANCH_URL/,
    );
  }
});

test("production canonical validation fails clearly when both supported origins are absent", () => {
  assert.throws(
    () => resolveCanonicalSiteUrl({ VERCEL_ENV: "production", VERCEL_URL: "nuede-deployment.vercel.app" }, { requireCanonical: true }),
    /Configure VITE_PUBLIC_SITE_URL.*VERCEL_PROJECT_PRODUCTION_URL.*VERCEL_URL.*never used/,
  );
});

test("the Vercel fallback accepts only a hostname-only vercel.app project domain", () => {
  assert.equal(validateVercelProductionHostname(" NUEDE-v2.vercel.app "), "nuede-v2.vercel.app");
  for (const value of [
    "", "https://nuede-v2.vercel.app", "nuede-v2.vercel.app/menu", "nuede-v2.vercel.app?x=1",
    "nuede-v2.vercel.app#x", "user@nuede-v2.vercel.app", "nuede-v2.com", "vercel.app",
  ]) assert.throws(() => validateVercelProductionHostname(value), /canonical production origin/);
});

test("development does not require a canonical URL while hosted previews do", () => {
  assert.doesNotThrow(() => validatePublicEnvironment({}));
  assert.throws(
    () => validatePublicEnvironment({}, { requireCanonical: true }),
    /VITE_PUBLIC_SITE_URL.*VERCEL_PROJECT_PRODUCTION_URL/,
  );
});
