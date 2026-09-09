import { lazy, Suspense } from "react";
import { LoadingState } from "../components/ui/FeedbackStates.jsx";
import { Route, Routes } from "react-router-dom";

import { StorefrontLayout } from "../components/layout/StorefrontLayout.jsx";
const CheckoutPage = lazy(() => import("../pages/CheckoutPage.jsx").then((module) => ({ default: module.CheckoutPage })));
import { StorefrontErrorPage } from "../pages/StorefrontErrorPage.jsx";
import { HomePage } from "../pages/HomePage.jsx";
import { MenuPage } from "../pages/MenuPage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";
import { ProductPage } from "../pages/ProductPage.jsx";
import { AboutPage, ContactPage, DeliveryAbujaPage, FaqPage, HighProteinMealsPage, MealPlansPage } from "../pages/SeoLandingPages.jsx";
const PaymentPage = lazy(() => import("../pages/PaymentPage.jsx").then((module) => ({ default: module.PaymentPage })));
const PlannerPage = lazy(() => import("../pages/PlannerPage.jsx").then((module) => ({ default: module.PlannerPage })));
import { SavedPage } from "../pages/SavedPage.jsx";

/** Shared route tree used by the browser and the Vite prerender entry. */
export function StorefrontRoutes() {
  // Declarative equivalent of the accepted data-router contract: errorElement: <StorefrontErrorPage />
  return <Routes>
    <Route path="/" element={<StorefrontLayout />} errorElement={<StorefrontErrorPage />}>
      <Route index element={<HomePage />} />
      <Route path="menu" element={<MenuPage />} />
      <Route path="menu/:slug" element={<ProductPage />} />
      <Route path="meal-plans" element={<MealPlansPage />} />
      <Route path="high-protein-meals" element={<HighProteinMealsPage />} />
      <Route path="delivery/abuja" element={<DeliveryAbujaPage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="faq" element={<FaqPage />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="saved" element={<SavedPage />} />
      <Route path="planner" element={<Suspense fallback={<LoadingState title="Loading page" message="Preparing your meals." />}><PlannerPage /></Suspense>} />
      <Route path="checkout" element={<Suspense fallback={<LoadingState title="Loading page" message="Preparing your meals." />}><CheckoutPage /></Suspense>} />
      <Route path="payment" element={<Suspense fallback={<LoadingState title="Loading page" message="Preparing your meals." />}><PaymentPage /></Suspense>} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>;
}
