import { publicEnvironmentGuard } from "../../scripts/public-environment.js";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [publicEnvironmentGuard({ canonicalSeo: true }), react(), tailwindcss()],
  server: {
    port: 5175,
    strictPort: true,
  },
});
