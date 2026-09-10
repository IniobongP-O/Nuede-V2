const publicNames = new Set([
  "VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_CONTACT_PHONE",
  "VITE_CONTACT_WHATSAPP", "VITE_CONTACT_EMAIL", "VITE_CONTACT_INSTAGRAM", "VITE_CONTACT_HOURS",
  "VITE_PUBLIC_SITE_URL", "VITE_GOOGLE_SITE_VERIFICATION",
]);
const vercelPublicPrefix = "VITE_VERCEL_";
const canonicalSiteUrlError = "Storefront SEO requires a valid VITE_PUBLIC_SITE_URL. Set it in the storefront Vercel project's Production environment (and Preview so previews canonicalize to production) to the permanent HTTPS root URL, for example https://www.your-domain.com. Credentials, paths, queries, fragments, localhost, placeholder domains, and *.vercel.app domains are not accepted.";

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

/** Returns a normalized canonical origin or throws an actionable, value-free configuration error. */
export function validateCanonicalSiteUrl(value) {
  const configuredValue = typeof value === "string" ? value.trim() : "";
  let siteUrl;
  try { siteUrl = new URL(configuredValue); } catch { /* Fail closed below. */ }
  const hostname = siteUrl?.hostname.toLowerCase() || "";
  const disallowedHost = /localhost|^127(?:\.|$)|example|placeholder|your-(?:domain|production)|\.vercel\.app$/i.test(hostname) || hostname === "[::1]";
  if (!siteUrl || siteUrl.protocol !== "https:" || siteUrl.username || siteUrl.password || siteUrl.pathname !== "/" || configuredValue.includes("?") || configuredValue.includes("#") || disallowedHost) {
    throw new Error(canonicalSiteUrlError);
  }
  return siteUrl.origin;
}

/** Validates the complete browser environment and returns its normalized public values. */
export function validatePublicEnvironment(env, { production = false, requireCanonical = production } = {}) {
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
  if (requireCanonical || env.VITE_PUBLIC_SITE_URL) {
    normalizedEnvironment.VITE_PUBLIC_SITE_URL = validateCanonicalSiteUrl(env.VITE_PUBLIC_SITE_URL);
  }
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

/** Guards Vite's resolved public env and injects only the safe deployment classification. */
export function publicEnvironmentGuard({ canonicalSeo = false } = {}) {
  return {
    name: "nuede-public-environment",
    config() {
      return { define: { "import.meta.env.VITE_NUEDE_DEPLOYMENT_ENV": JSON.stringify(getDeploymentEnvironment()) } };
    },
    configResolved(config) {
      const deploymentEnvironment = getDeploymentEnvironment();
      const publicEnvironment = mergePublicEnvironment(config.env, process.env);
      validatePublicEnvironment(publicEnvironment, {
        production: deploymentEnvironment === "production",
        requireCanonical: canonicalSeo && ["production", "preview"].includes(deploymentEnvironment),
      });
    },
  };
}
