import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import App from "./App.jsx";
import { menuQueryKeys } from "./features/menu/hooks/useMenu.js";
import { createStorefrontQueryClient } from "./lib/queryClient.js";
import { StorefrontErrorBoundary } from "./pages/StorefrontErrorPage.jsx";
import "./styles.css";

const root = document.getElementById("root");
const dataNode = document.getElementById("nuede-prerender-data");
let prerenderData = null;
try { prerenderData = dataNode ? JSON.parse(dataNode.textContent) : null; } catch { /* The live queries remain the safe fallback. */ }
const queryClient = createStorefrontQueryClient();
if (prerenderData) {
  queryClient.setQueryData(menuQueryKeys.categories, prerenderData.categories || []);
  queryClient.setQueryData(menuQueryKeys.products, prerenderData.products || []);
  queryClient.setQueryData(menuQueryKeys.redirects, prerenderData.redirects || []);
  globalThis.__NUEDE_PRERENDER_HYDRATION__ = true;
}
const application = (
  <StrictMode>
    <StorefrontErrorBoundary>
      <App queryClient={queryClient} />
    </StorefrontErrorBoundary>
  </StrictMode>
);
if (root.hasChildNodes() && prerenderData) hydrateRoot(root, application);
else createRoot(root).render(application);
