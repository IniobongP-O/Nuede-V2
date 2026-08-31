import { createBrowserRouter } from "react-router-dom";

import { StorefrontLayout } from "../components/layout/StorefrontLayout.jsx";
import { CheckoutPage } from "../pages/CheckoutPage.jsx";
import { HomePage } from "../pages/HomePage.jsx";
import { MenuPage } from "../pages/MenuPage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";
import { PaymentPage } from "../pages/PaymentPage.jsx";
import { PlannerPage } from "../pages/PlannerPage.jsx";
import { SavedPage } from "../pages/SavedPage.jsx";

export const storefrontRouter = createBrowserRouter([
  {
    path: "/",
    element: <StorefrontLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "menu", element: <MenuPage /> },
      { path: "saved", element: <SavedPage /> },
      { path: "planner", element: <PlannerPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "payment", element: <PaymentPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
