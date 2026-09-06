import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAddon,
  createCategory,
  createStandardProduct,
  deleteAddon,
  deleteProduct,
  deleteVariant,
  listAddons,
  listCategories,
  listProducts,
  reorderVariants,
  saveGroupedProduct,
  saveVariant,
  setCategoryEnabled,
  updateAddon,
  updateCategory,
  updateProductStatus,
  updateStandardProduct,
} from "../api/catalogApi.js";

export const catalogQueryKeys = Object.freeze({
  all: ["admin-catalog"],
  categories: ["admin-catalog", "categories"],
  products: ["admin-catalog", "products"],
  addons: ["admin-catalog", "addons"],
});

export function useCategories() {
  return useQuery({ queryKey: catalogQueryKeys.categories, queryFn: listCategories });
}

export function useProducts() {
  return useQuery({ queryKey: catalogQueryKeys.products, queryFn: listProducts });
}

export function useStandardProducts() {
  return useProducts();
}

export function useAddons() {
  return useQuery({ queryKey: catalogQueryKeys.addons, queryFn: listAddons });
}

function useCatalogMutation(mutationFn, keys = [catalogQueryKeys.products]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}

export function useCreateCategory() {
  return useCatalogMutation(createCategory, [catalogQueryKeys.categories, catalogQueryKeys.products]);
}
export function useUpdateCategory() {
  return useCatalogMutation(updateCategory, [catalogQueryKeys.categories, catalogQueryKeys.products]);
}
export function useSetCategoryEnabled() {
  return useCatalogMutation(setCategoryEnabled, [catalogQueryKeys.categories, catalogQueryKeys.products]);
}
export function useCreateProduct() { return useCatalogMutation(createStandardProduct); }
export function useUpdateProduct() { return useCatalogMutation(updateStandardProduct); }
export function useSaveGroupedProduct() { return useCatalogMutation(saveGroupedProduct); }
export function useUpdateProductStatus() { return useCatalogMutation(updateProductStatus); }
export function useDeleteProduct() { return useCatalogMutation(deleteProduct); }
export function useSaveVariant() { return useCatalogMutation(saveVariant); }
export function useDeleteVariant() { return useCatalogMutation(deleteVariant); }
export function useReorderVariants() { return useCatalogMutation(reorderVariants); }
export function useCreateAddon() {
  return useCatalogMutation(createAddon, [catalogQueryKeys.addons, catalogQueryKeys.products]);
}
export function useUpdateAddon() {
  return useCatalogMutation(updateAddon, [catalogQueryKeys.addons, catalogQueryKeys.products]);
}
export function useDeleteAddon() {
  return useCatalogMutation(deleteAddon, [catalogQueryKeys.addons, catalogQueryKeys.products]);
}
