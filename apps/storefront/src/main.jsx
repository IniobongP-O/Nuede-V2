import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import { StorefrontErrorBoundary } from "./pages/StorefrontErrorPage.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <StorefrontErrorBoundary>
      <App />
    </StorefrontErrorBoundary>
  </StrictMode>,
);
