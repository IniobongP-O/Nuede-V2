import { createBrowserRouter, Navigate } from "react-router-dom";

import { AdminLayout } from "../components/layout/AdminLayout.jsx";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute.jsx";
import { PublicOnlyRoute } from "../features/auth/components/PublicOnlyRoute.jsx";
import { AnalyticsPage } from "../pages/AnalyticsPage.jsx";
import { DashboardPage } from "../pages/DashboardPage.jsx";
import { DeliveryPage } from "../pages/DeliveryPage.jsx";
import { FeedbackPage } from "../pages/FeedbackPage.jsx";
import { LoginPage } from "../pages/LoginPage.jsx";
import { MenuPage } from "../pages/MenuPage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";
import { OrdersPage } from "../pages/OrdersPage.jsx";
import { SettingsPage } from "../pages/SettingsPage.jsx";
import { TestimonialsPage } from "../pages/TestimonialsPage.jsx";

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
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/menu", element: <MenuPage /> },
          { path: "/orders", element: <OrdersPage /> },
          { path: "/analytics", element: <AnalyticsPage /> },
          { path: "/delivery", element: <DeliveryPage /> },
          { path: "/testimonials", element: <TestimonialsPage /> },
          { path: "/feedback", element: <FeedbackPage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
