import { useQuery } from "@tanstack/react-query";

import { getCategories, getMenuProducts } from "../api/menuApi.js";

export const menuQueryKeys = Object.freeze({
  all: ["storefront-menu"],
  categories: ["storefront-menu", "categories"],
  products: ["storefront-menu", "products"],
});

const menuQueryOptions = {
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
};

export function useCategories() {
  return useQuery({ ...menuQueryOptions, queryKey: menuQueryKeys.categories, queryFn: getCategories });
}

export function useMenu() {
  return useQuery({ ...menuQueryOptions, queryKey: menuQueryKeys.products, queryFn: getMenuProducts });
}
