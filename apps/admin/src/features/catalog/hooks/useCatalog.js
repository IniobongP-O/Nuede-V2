import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCategory,
  createStandardProduct,
  listCategories,
  listStandardProducts,
  setCategoryEnabled,
  updateCategory,
  updateProductStatus,
  updateStandardProduct,
} from "../api/catalogApi.js";

export const catalogQueryKeys = Object.freeze({
  all: ["admin-catalog"],
  categories: ["admin-catalog", "categories"],
  products: ["admin-catalog", "standard-products"],
});

export function useCategories() {
  return useQuery({ queryKey: catalogQueryKeys.categories, queryFn: listCategories });
}

export function useStandardProducts() {
  return useQuery({ queryKey: catalogQueryKeys.products, queryFn: listStandardProducts });
}

function useCatalogMutation(mutationFn, invalidateCategories = false) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      const invalidations = [queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products })];
      if (invalidateCategories) {
        invalidations.push(queryClient.invalidateQueries({ queryKey: catalogQueryKeys.categories }));
      }
      await Promise.all(invalidations);
    },
  });
}

export function useCreateCategory() { return useCatalogMutation(createCategory, true); }
export function useUpdateCategory() { return useCatalogMutation(updateCategory, true); }
export function useSetCategoryEnabled() { return useCatalogMutation(setCategoryEnabled, true); }
export function useCreateProduct() { return useCatalogMutation(createStandardProduct); }
export function useUpdateProduct() { return useCatalogMutation(updateStandardProduct); }
export function useUpdateProductStatus() { return useCatalogMutation(updateProductStatus); }
