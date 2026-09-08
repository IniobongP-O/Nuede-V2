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

/** Provides the ordered category query used by catalog editors. */
export function useCategories() {
  return useQuery({ queryKey: catalogQueryKeys.categories, queryFn: listCategories });
}

/** Provides the complete normalized admin product query. */
export function useProducts() {
  return useQuery({ queryKey: catalogQueryKeys.products, queryFn: listProducts });
}

/** Provides standard products eligible for add-on management. */
export function useStandardProducts() {
  return useProducts();
}

/** Provides the complete product add-on query. */
export function useAddons() {
  return useQuery({ queryKey: catalogQueryKeys.addons, queryFn: listAddons });
}

/** Creates a catalog mutation that invalidates its affected query keys on success. */
function useCatalogMutation(mutationFn, keys = [catalogQueryKeys.products]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}

/** Creates the category-creation mutation and refreshes category data. */
export function useCreateCategory() {
  return useCatalogMutation(createCategory, [catalogQueryKeys.categories, catalogQueryKeys.products]);
}
/** Creates the category-update mutation and refreshes category data. */
export function useUpdateCategory() {
  return useCatalogMutation(updateCategory, [catalogQueryKeys.categories, catalogQueryKeys.products]);
}
/** Creates the category availability mutation and refreshes dependent catalog data. */
export function useSetCategoryEnabled() {
  return useCatalogMutation(setCategoryEnabled, [catalogQueryKeys.categories, catalogQueryKeys.products]);
}
/** Creates the standard-product creation mutation. */
export function useCreateProduct() { return useCatalogMutation(createStandardProduct); }
/** Creates the standard-product update mutation. */
export function useUpdateProduct() { return useCatalogMutation(updateStandardProduct); }
/** Creates the grouped-product upsert mutation. */
export function useSaveGroupedProduct() { return useCatalogMutation(saveGroupedProduct); }
/** Creates the product availability mutation. */
export function useUpdateProductStatus() { return useCatalogMutation(updateProductStatus); }
/** Creates the audited product-deletion mutation. */
export function useDeleteProduct() { return useCatalogMutation(deleteProduct); }
/** Creates the grouped-variant upsert mutation. */
export function useSaveVariant() { return useCatalogMutation(saveVariant); }
/** Creates the grouped-variant deletion mutation. */
export function useDeleteVariant() { return useCatalogMutation(deleteVariant); }
/** Creates the exact-set variant reorder mutation. */
export function useReorderVariants() { return useCatalogMutation(reorderVariants); }
/** Creates the add-on mutation and refreshes add-ons plus assigned products. */
export function useCreateAddon() {
  return useCatalogMutation(createAddon, [catalogQueryKeys.addons, catalogQueryKeys.products]);
}
/** Updates an add-on and refreshes add-ons plus assigned products. */
export function useUpdateAddon() {
  return useCatalogMutation(updateAddon, [catalogQueryKeys.addons, catalogQueryKeys.products]);
}
/** Deletes an add-on and refreshes add-ons plus assigned products. */
export function useDeleteAddon() {
  return useCatalogMutation(deleteAddon, [catalogQueryKeys.addons, catalogQueryKeys.products]);
}
