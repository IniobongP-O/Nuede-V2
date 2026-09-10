const environment = import.meta.env || globalThis.process?.env || {};
const configuredUrl = environment.VITE_NUEDE_CANONICAL_SITE_URL?.trim() || environment.VITE_PUBLIC_SITE_URL?.trim();
const deploymentEnvironment = environment.VITE_NUEDE_DEPLOYMENT_ENV || globalThis.process?.env?.VERCEL_ENV || "local";

/** Public, non-secret SEO configuration shared by metadata and prerendering. */
export const seoConfig = Object.freeze({
  siteName: "Nuede",
  siteUrl: configuredUrl ? configuredUrl.replace(/\/+$/, "") : "http://localhost:5175",
  locale: "en_NG",
  defaultTitle: "Prepared Meals & Meal Plans in Abuja | Nuede",
  defaultDescription: "Explore Nuede prepared meals in Abuja, compare clear nutrition information, customize eligible meals, and build a practical meal plan.",
  searchConsoleVerification: environment.VITE_GOOGLE_SITE_VERIFICATION?.trim() || "",
  previewDeployment: deploymentEnvironment === "preview",
});
