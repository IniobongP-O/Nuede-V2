import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { AdminLayout } from "../components/layout/AdminLayout.jsx";
import { LoadingState } from "../components/ui/FeedbackStates.jsx";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute.jsx";
import { PublicOnlyRoute } from "../features/auth/components/PublicOnlyRoute.jsx";
const AnalyticsPage = lazy(() => import("../pages/AnalyticsPage.jsx").then((module) => ({ default: module.AnalyticsPage })));
const DashboardPage = lazy(() => import("../pages/DashboardPage.jsx").then((module) => ({ default: module.DashboardPage })));
const DeliveryPage = lazy(() => import("../pages/DeliveryPage.jsx").then((module) => ({ default: module.DeliveryPage })));
const FeedbackPage = lazy(() => import("../pages/FeedbackPage.jsx").then((module) => ({ default: module.FeedbackPage })));
import { LoginPage } from "../pages/LoginPage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";
const OrdersPage = lazy(() => import("../pages/OrdersPage.jsx").then((module) => ({ default: module.OrdersPage })));
const OrderDetailPage = lazy(() => import("../pages/OrderDetailPage.jsx").then((module) => ({ default: module.OrderDetailPage })));
const SettingsPage = lazy(() => import("../pages/SettingsPage.jsx").then((module) => ({ default: module.SettingsPage })));
const TestimonialsPage = lazy(() => import("../pages/TestimonialsPage.jsx").then((module) => ({ default: module.TestimonialsPage })));

const MenuPage = lazy(() => import("../pages/MenuPage.jsx").then((module) => ({ default: module.MenuPage })));

export const adminRouter = createBrowserRouter([
  { path: "/", element: <Navigate replace to="/login" /> },
  {
    element: <PublicOnlyRoute />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: "/dashboard", element: <Suspense fallback={<LoadingState title="Loading reporting" message="Preparing sales reporting." />}><DashboardPage /></Suspense> },
          { path: "/menu", element: <Suspense fallback={<LoadingState title="Loading menu management" message="Preparing the live catalog workspace." />}><MenuPage /></Suspense> },
          { path: "/orders", element: <Suspense fallback={<LoadingState title="Loading orders" />}><OrdersPage /></Suspense> },
          { path: "/orders/:orderReference", element: <Suspense fallback={<LoadingState title="Loading order" />}><OrderDetailPage /></Suspense> },
          { path: "/analytics", element: <Suspense fallback={<LoadingState title="Loading reporting" message="Preparing sales reporting." />}><AnalyticsPage /></Suspense> },
          { path: "/delivery", element: <Suspense fallback={<LoadingState title="Loading delivery" />}><DeliveryPage /></Suspense> },
          { path: "/testimonials", element: <Suspense fallback={<LoadingState title="Loading testimonials" />}><TestimonialsPage /></Suspense> },
          { path: "/feedback", element: <Suspense fallback={<LoadingState title="Loading feedback" />}><FeedbackPage /></Suspense> },
          { path: "/settings", element: <Suspense fallback={<LoadingState title="Loading settings" />}><SettingsPage /></Suspense> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
