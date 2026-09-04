import { getCompatibleAddons, getDefaultVariant, getVisibleVariants, isVariantOrderableForProduct } from "./customizationModel.js";

export function createCustomizationState({ product, initialConfiguration }) {
  const initial = initialConfiguration?.productId === product.id ? initialConfiguration : null;
  return {
    catalogProduct: product,
    variantId: initial ? initial.variantId : getDefaultVariant(product)?.id || null,
    addonIds: initial ? [...initial.addonIds] : [],
    quantity: initial && Number.isSafeInteger(initial.quantity) && initial.quantity > 0 ? initial.quantity : 1,
    submissionIssues: [], catalogNotice: "",
  };
}

export function reconcileCustomization(state, product) {
  if (state.catalogProduct === product) return state;
  const selectedVariant = getVisibleVariants(product).find((variant) => variant.id === state.variantId);
  const variantId = isVariantOrderableForProduct(product, selectedVariant) ? state.variantId : null;
  const availableIds = new Set(getCompatibleAddons(product).filter((addon) => addon.isAvailable).map((addon) => addon.id));
  const addonIds = state.addonIds.filter((id) => availableIds.has(id));
  return {
    ...state, catalogProduct: product, variantId, addonIds, submissionIssues: [],
    catalogNotice: state.variantId && !variantId
      ? "Your meal option changed and must be selected again."
      : addonIds.length !== state.addonIds.length ? "An add-on changed and was removed from this selection." : state.catalogNotice,
  };
}

export function customizationReducer(previous, action) {
  const state = reconcileCustomization(previous, action.product);
  switch (action.type) {
    case "catalog-refreshed": return state;
    case "variant": {
      const variant = getVisibleVariants(action.product).find((item) => item.id === action.variantId);
      return isVariantOrderableForProduct(action.product, variant)
        ? { ...state, variantId: action.variantId, submissionIssues: [], catalogNotice: "" } : state;
    }
    case "addon": {
      const addon = getCompatibleAddons(action.product).find((item) => item.id === action.addonId);
      if (!addon?.isAvailable) return state;
      return { ...state, addonIds: state.addonIds.includes(action.addonId) ? state.addonIds.filter((id) => id !== action.addonId) : [...state.addonIds, action.addonId], submissionIssues: [] };
    }
    case "decrement": return { ...state, quantity: Math.max(1, state.quantity - 1), submissionIssues: [] };
    case "increment": return { ...state, quantity: Number.isSafeInteger(state.quantity + 1) ? state.quantity + 1 : state.quantity, submissionIssues: [] };
    case "submission": return { ...state, submissionIssues: action.issues };
    default: return state;
  }
}
