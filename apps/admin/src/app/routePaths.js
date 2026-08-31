export const adminPaths = Object.freeze({
  login: "/login",
  dashboard: "/dashboard",
  menu: "/menu",
  orders: "/orders",
  analytics: "/analytics",
  delivery: "/delivery",
  testimonials: "/testimonials",
  feedback: "/feedback",
  settings: "/settings",
});

export const adminNavigation = Object.freeze([
  { label: "Overview", path: adminPaths.dashboard, icon: "layout-dashboard" },
  { label: "Orders", path: adminPaths.orders, icon: "receipt-text" },
  { label: "Menu", path: adminPaths.menu, icon: "utensils" },
  { label: "Analytics", path: adminPaths.analytics, icon: "chart-no-axes-combined" },
  { label: "Delivery", path: adminPaths.delivery, icon: "map-pinned" },
  { label: "Testimonials", path: adminPaths.testimonials, icon: "message-square-quote" },
  { label: "Feedback", path: adminPaths.feedback, icon: "messages-square" },
  { label: "Settings", path: adminPaths.settings, icon: "settings" },
]);

export const adminRouteList = Object.freeze(Object.values(adminPaths));
