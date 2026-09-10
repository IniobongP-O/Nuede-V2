import { publicEnvironmentGuard, resolveStorefrontEnvironment } from "../../scripts/public-environment.js";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const { siteUrl } = resolveStorefrontEnvironment(loadEnv(mode, import.meta.dirname, "VITE_"), process.env);
  return {
    plugins: [publicEnvironmentGuard({ canonicalSeo: true, canonicalSiteUrl: siteUrl }), react(), tailwindcss()],
    server: {
      port: 5175,
      strictPort: true,
    },
  };
});
