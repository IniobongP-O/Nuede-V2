import { useQuery } from "@tanstack/react-query";

import { getCategories, getMenuProducts, getProductSlugRedirects } from "../api/menuApi.js";

export const menuQueryKeys = Object.freeze({
  all: ["storefront-menu"],
  categories: ["storefront-menu", "categories"],
  products: ["storefront-menu", "products"],
  redirects: ["storefront-menu", "slug-redirects"],
});

const menuQueryOptions = {
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
};

/** Provides the live, periodically refreshed public category query. */
export function useCategories() {
  return useQuery({ ...menuQueryOptions, queryKey: menuQueryKeys.categories, queryFn: getCategories });
}

/** Provides the live, periodically refreshed normalized product query. */
export function useMenu() {
  return useQuery({ ...menuQueryOptions, queryKey: menuQueryKeys.products, queryFn: getMenuProducts });
}

export function useProductSlugRedirects() {
  return useQuery({ ...menuQueryOptions, queryKey: menuQueryKeys.redirects, queryFn: getProductSlugRedirects });
}
