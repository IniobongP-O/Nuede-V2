export const storefrontPaths = Object.freeze({
  home: "/",
  menu: "/menu",
  saved: "/saved",
  planner: "/planner",
  checkout: "/checkout",
  payment: "/payment",
});

export const storefrontNavigation = Object.freeze([
  { label: "Home", path: storefrontPaths.home, end: true },
  { label: "Menu", path: storefrontPaths.menu },
  { label: "Meal Planner", path: storefrontPaths.planner },
  { label: "Saved", path: storefrontPaths.saved },
]);

export const storefrontRouteList = Object.freeze(Object.values(storefrontPaths));
