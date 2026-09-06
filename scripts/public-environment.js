const publicNames = new Set([
  "VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_CONTACT_PHONE",
  "VITE_CONTACT_WHATSAPP", "VITE_CONTACT_EMAIL", "VITE_CONTACT_INSTAGRAM", "VITE_CONTACT_HOURS",
]);
const vercelPublicPrefix = "VITE_VERCEL_";

export function containsBackendSecret(value) {
  if (/(?:sk_(?:live|test)_[a-zA-Z0-9]{12,}|sb_secret_[a-zA-Z0-9_-]{12,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|postgres(?:ql)?:\/\/[^\s:/]+:[^\s@]+@)/.test(value)) return true;
  for (const token of value.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || []) {
    try {
      if (JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).role === "service_role") return true;
    } catch { /* Not a decodable JWT. */ }
  }
  return false;
}

export function validatePublicEnvironment(env, { production = false } = {}) {
  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith("VITE_")) continue;
    const allowedName = publicNames.has(name) || name.startsWith(vercelPublicPrefix);
    // Platform metadata is public by name, but it must cross the same secret-value boundary.
    if (!allowedName || containsBackendSecret(String(value))) {
      // Never include a rejected value in build logs.
      throw new Error(`Unsafe frontend environment variable: ${name}`);
    }
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
}

export function publicEnvironmentGuard() {
  return {
    name: "nuede-public-environment",
    configResolved(config) {
      validatePublicEnvironment(config.env, { production: process.env.VERCEL_ENV === "production" });
    },
  };
}
