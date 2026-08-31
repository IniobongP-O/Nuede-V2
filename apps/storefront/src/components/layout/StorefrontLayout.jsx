import { Outlet } from "react-router-dom";

import { ToastProvider } from "../ui/Toast.jsx";
import { StorefrontFooter } from "./StorefrontFooter.jsx";
import { StorefrontHeader } from "./StorefrontHeader.jsx";

export function StorefrontLayout() {
  return (
    <ToastProvider>
      <a className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-control bg-brand-950 px-4 py-3 text-sm font-semibold text-white transition-transform focus:translate-y-0" href="#main-content">Skip to main content</a>
      <div className="min-h-screen bg-canvas">
        <StorefrontHeader />
        <main id="main-content" tabIndex="-1"><Outlet /></main>
        <StorefrontFooter />
      </div>
    </ToastProvider>
  );
}
