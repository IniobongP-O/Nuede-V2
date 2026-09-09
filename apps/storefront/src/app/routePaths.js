export const storefrontPaths = Object.freeze({
  home: "/",
  menu: "/menu",
  mealPlans: "/meal-plans",
  highProtein: "/high-protein-meals",
  deliveryAbuja: "/delivery/abuja",
  about: "/about",
  faq: "/faq",
  contact: "/contact",
  saved: "/saved",
  planner: "/planner",
  checkout: "/checkout",
  payment: "/payment",
});

export const productPath = (slug) => `/menu/${encodeURIComponent(slug)}`;

export const storefrontNavigation = Object.freeze([
  { label: "Home", path: storefrontPaths.home, end: true },
  { label: "Menu", path: storefrontPaths.menu },
  { label: "Meal Plans", path: storefrontPaths.mealPlans },
  { label: "Saved", path: storefrontPaths.saved },
]);

// Retained as the accepted Cycle 1 route contract; later public routes are
// intentionally additive and are covered by their cycle-specific verification.
export const storefrontRouteList = Object.freeze([
  storefrontPaths.home, storefrontPaths.menu, storefrontPaths.saved,
  storefrontPaths.planner, storefrontPaths.checkout, storefrontPaths.payment,
]);
