import { useEffect, useMemo, useReducer } from "react";

import { buildProductConfiguration, getCompatibleAddons, getVisibleVariants, validateProductConfiguration } from "../utils/customizationModel.js";
import { createCustomizationState, customizationReducer, reconcileCustomization } from "../utils/customizationState.js";

export function useProductCustomization(product, onConfigured, initialConfiguration = null) {
  const [storedState, dispatch] = useReducer(customizationReducer, { product, initialConfiguration }, createCustomizationState);
  // Derive valid selections before effects, so no stale configuration can be
  // displayed or submitted. Effects commit catalog transitions outside render;
  // reducer actions reconcile too, including interactions before that effect.
  const state = useMemo(() => reconcileCustomization(storedState, product), [storedState, product]);
  useEffect(() => {
    if (storedState.catalogProduct !== product) dispatch({ type: "catalog-refreshed", product });
  }, [product, storedState.catalogProduct]);
  const visibleVariants = useMemo(() => getVisibleVariants(product), [product]);
  const compatibleAddons = useMemo(() => getCompatibleAddons(product), [product]);
  const { variantId, addonIds, quantity, submissionIssues, catalogNotice } = state;
  const validation = useMemo(
    () => validateProductConfiguration({ product, variantId, addonIds, quantity }),
    [product, variantId, addonIds, quantity],
  );
  const selectedVariant = visibleVariants.find((variant) => variant.id === variantId) || null;

  function submit() {
    const result = buildProductConfiguration({ product, variantId, addonIds, quantity });
    dispatch({ type: "submission", product, issues: result.issues });
    if (!result.valid) return result;
    onConfigured?.(result.configuration);
    return result;
  }

  return {
    variantId, addonIds, quantity, visibleVariants, compatibleAddons, selectedVariant,
    validation, submissionIssues, catalogNotice,
    chooseVariant: (nextVariantId) => dispatch({ type: "variant", product, variantId: nextVariantId }),
    toggleAddon: (addonId) => dispatch({ type: "addon", product, addonId }),
    decrementQuantity: () => dispatch({ type: "decrement", product }),
    incrementQuantity: () => dispatch({ type: "increment", product }),
    submit,
  };
}
