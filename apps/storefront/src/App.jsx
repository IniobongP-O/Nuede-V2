import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, StaticRouter } from "react-router-dom";

import { StorefrontRoutes } from "./app/router.jsx";
import { createStorefrontQueryClient } from "./lib/queryClient.js";

/** Composes global storefront providers around the application router. */
function App({ location, queryClient = createStorefrontQueryClient() }) {
  const Router = location ? StaticRouter : BrowserRouter;
  const routerProps = location ? { location } : {};
  return <QueryClientProvider client={queryClient}><Router {...routerProps}><StorefrontRoutes /></Router></QueryClientProvider>;
}

export default App;
