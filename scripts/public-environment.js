const publicNames = new Set([
  "VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_CONTACT_PHONE",
  "VITE_CONTACT_WHATSAPP", "VITE_CONTACT_EMAIL", "VITE_CONTACT_INSTAGRAM", "VITE_CONTACT_HOURS",
  "VITE_PUBLIC_SITE_URL", "VITE_GOOGLE_SITE_VERIFICATION",
]);
const vercelPublicPrefix = "VITE_VERCEL_";
const localCanonicalSiteUrl = "http://localhost:5175";
const canonicalSiteUrlError = "Storefront SEO requires a canonical production origin. Configure VITE_PUBLIC_SITE_URL to your permanent HTTPS custom domain, or deploy through Vercel with VERCEL_PROJECT_PRODUCTION_URL available. Deployment-specific VERCEL_URL and VERCEL_BRANCH_URL domains are never used as canonical URLs.";

/** Returns whether a value resembles a backend credential that must never enter a browser bundle. */
export function containsBackendSecret(value) {
  if (/(?:sk_(?:live|test)_[a-zA-Z0-9]{12,}|sb_secret_[a-zA-Z0-9_-]{12,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|postgres(?:ql)?:\/\/[^\s:/]+:[^\s@]+@)/.test(value)) return true;
  for (const token of value.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || []) {
    try {
      if (JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).role === "service_role") return true;
    } catch { /* Not a decodable JWT. */ }
  }
  return false;
}

/** Merges browser-prefixed values with deployment-injected values taking precedence. */
export function mergePublicEnvironment(fileEnvironment = {}, processEnvironment = {}) {
  const mergedEnvironment = {};
  for (const environment of [fileEnvironment, processEnvironment]) {
    for (const [name, value] of Object.entries(environment)) {
      if (name.startsWith("VITE_")) mergedEnvironment[name] = value;
    }
  }
  return mergedEnvironment;
}

/** Classifies the Vercel build without treating deployment URLs as canonical configuration. */
export function getDeploymentEnvironment(processEnvironment = process.env) {
  return ["production", "preview", "development"].includes(processEnvironment.VERCEL_ENV)
    ? processEnvironment.VERCEL_ENV
    : "local";
}

/** Validates the hostname-only Vercel system value used by the trusted fallback path. */
export function validateVercelProductionHostname(value) {
  const hostname = typeof value === "string" ? value.trim().toLowerCase() : "";
  const vercelHostname = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.vercel\.app$/;
  if (!vercelHostname.test(hostname)) throw new Error(canonicalSiteUrlError);
  return hostname;
}

/** Returns a normalized canonical origin or throws an actionable, value-free configuration error. */
export function validateCanonicalSiteUrl(value, { trustedVercelProductionHostname = "" } = {}) {
  const configuredValue = typeof value === "string" ? value.trim() : "";
  let siteUrl;
  try { siteUrl = new URL(configuredValue); } catch { /* Fail closed below. */ }
  const hostname = siteUrl?.hostname.toLowerCase() || "";
  const isVercelHostname = hostname.endsWith(".vercel.app");
  const allowedVercelHostname = Boolean(trustedVercelProductionHostname) && hostname === trustedVercelProductionHostname;
  const disallowedHost = /localhost|^127(?:\.|$)|example|placeholder|your-(?:domain|production)/i.test(hostname)
    || hostname === "[::1]"
    || hostname.endsWith(".")
    || (isVercelHostname && !allowedVercelHostname);
  if (!siteUrl || siteUrl.protocol !== "https:" || siteUrl.username || siteUrl.password || siteUrl.port || siteUrl.pathname !== "/" || configuredValue.includes("?") || configuredValue.includes("#") || disallowedHost) {
    throw new Error(canonicalSiteUrlError);
  }
  return siteUrl.origin;
}

/** Resolves the one canonical storefront origin without consulting deployment-specific URLs. */
export function resolveCanonicalSiteUrl(env = {}, { requireCanonical = false, localFallback = localCanonicalSiteUrl } = {}) {
  const explicitSiteUrl = typeof env.VITE_PUBLIC_SITE_URL === "string" ? env.VITE_PUBLIC_SITE_URL.trim() : "";
  const deploymentEnvironment = getDeploymentEnvironment(env);
  const onVercel = deploymentEnvironment !== "local";

  if (explicitSiteUrl) {
    let trustedVercelProductionHostname = "";
    let explicitHostname = "";
    try { explicitHostname = new URL(explicitSiteUrl).hostname.toLowerCase(); } catch { /* The canonical validator reports the safe error. */ }
    if (onVercel && explicitHostname.endsWith(".vercel.app") && env.VERCEL_PROJECT_PRODUCTION_URL) {
      trustedVercelProductionHostname = validateVercelProductionHostname(env.VERCEL_PROJECT_PRODUCTION_URL);
    }
    return validateCanonicalSiteUrl(explicitSiteUrl, { trustedVercelProductionHostname });
  }

  if (onVercel && env.VERCEL_PROJECT_PRODUCTION_URL) {
    const trustedVercelProductionHostname = validateVercelProductionHostname(env.VERCEL_PROJECT_PRODUCTION_URL);
    return validateCanonicalSiteUrl(`https://${trustedVercelProductionHostname}`, { trustedVercelProductionHostname });
  }

  if (requireCanonical) throw new Error(canonicalSiteUrlError);
  return localFallback;
}

/** Validates the complete browser environment and returns its normalized public values. */
export function validatePublicEnvironment(env, { production = false, requireCanonical = production, systemEnvironment = {} } = {}) {
  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith("VITE_")) continue;
    const allowedName = publicNames.has(name) || name.startsWith(vercelPublicPrefix);
    // Platform metadata is public by name, but it must cross the same secret-value boundary.
    if (!allowedName || containsBackendSecret(String(value))) {
      // Never include a rejected value in build logs.
      throw new Error(`Unsafe frontend environment variable: ${name}`);
    }
  }
  const normalizedEnvironment = { ...env };
  normalizedEnvironment.siteUrl = resolveCanonicalSiteUrl({ ...systemEnvironment, ...env }, { requireCanonical });
  if (env.VITE_PUBLIC_SITE_URL) normalizedEnvironment.VITE_PUBLIC_SITE_URL = normalizedEnvironment.siteUrl;
  if (production) {
    const key = env.VITE_SUPABASE_ANON_KEY || "";
    let url;
    try { url = new URL(env.VITE_SUPABASE_URL); } catch { /* Fail closed below. */ }
    if (!url || url.protocol !== "https:" || url.username || url.password || /localhost|127\.0\.0\.1|your-project/.test(url.hostname)) {
      throw new Error("Production requires the intended HTTPS Supabase URL.");
    }
    if (!key || /your-|example|placeholder|fixture/.test(key)) throw new Error("Production requires a Supabase public key.");
  }
  return normalizedEnvironment;
}

/** Resolves browser-safe values and server-only Vercel context for a storefront build. */
export function resolveStorefrontEnvironment(fileEnvironment = {}, processEnvironment = process.env) {
  const deploymentEnvironment = getDeploymentEnvironment(processEnvironment);
  const production = deploymentEnvironment === "production";
  const preview = deploymentEnvironment === "preview";
  const publicEnvironment = validatePublicEnvironment(
    mergePublicEnvironment(fileEnvironment, processEnvironment),
    { production, requireCanonical: production || preview, systemEnvironment: processEnvironment },
  );
  return { deploymentEnvironment, production, preview, publicEnvironment, siteUrl: publicEnvironment.siteUrl };
}

/** Guards Vite's resolved public env and injects only the safe deployment classification. */
export function publicEnvironmentGuard({ canonicalSeo = false, canonicalSiteUrl = "" } = {}) {
  return {
    name: "nuede-public-environment",
    config() {
      const define = { "import.meta.env.VITE_NUEDE_DEPLOYMENT_ENV": JSON.stringify(getDeploymentEnvironment()) };
      if (canonicalSiteUrl) define["import.meta.env.VITE_NUEDE_CANONICAL_SITE_URL"] = JSON.stringify(canonicalSiteUrl);
      return { define };
    },
    configResolved(config) {
      const deploymentEnvironment = getDeploymentEnvironment();
      const publicEnvironment = mergePublicEnvironment(config.env, process.env);
      validatePublicEnvironment(publicEnvironment, {
        production: deploymentEnvironment === "production",
        requireCanonical: canonicalSeo && ["production", "preview"].includes(deploymentEnvironment),
        systemEnvironment: process.env,
      });
    },
  };
}
