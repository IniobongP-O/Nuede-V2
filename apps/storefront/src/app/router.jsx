import { lazy, Suspense } from "react";
import { LoadingState } from "../components/ui/FeedbackStates.jsx";
import { createBrowserRouter } from "react-router-dom";

import { StorefrontLayout } from "../components/layout/StorefrontLayout.jsx";
const CheckoutPage = lazy(() => import("../pages/CheckoutPage.jsx").then((module) => ({ default: module.CheckoutPage })));
import { StorefrontErrorPage } from "../pages/StorefrontErrorPage.jsx";
import { HomePage } from "../pages/HomePage.jsx";
import { MenuPage } from "../pages/MenuPage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";
const PaymentPage = lazy(() => import("../pages/PaymentPage.jsx").then((module) => ({ default: module.PaymentPage })));
const PlannerPage = lazy(() => import("../pages/PlannerPage.jsx").then((module) => ({ default: module.PlannerPage })));
import { SavedPage } from "../pages/SavedPage.jsx";

export const storefrontRouter = createBrowserRouter([
  {
    path: "/",
    element: <StorefrontLayout />,
    errorElement: <StorefrontErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "menu", element: <MenuPage /> },
      { path: "saved", element: <SavedPage /> },
      { path: "planner", element: <Suspense fallback={<LoadingState title="Loading page" message="Preparing your meals." />}><PlannerPage /></Suspense> },
      { path: "checkout", element: <Suspense fallback={<LoadingState title="Loading page" message="Preparing your meals." />}><CheckoutPage /></Suspense> },
      { path: "payment", element: <Suspense fallback={<LoadingState title="Loading page" message="Preparing your meals." />}><PaymentPage /></Suspense> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
