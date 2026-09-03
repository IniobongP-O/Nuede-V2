import { useMemo, useState } from "react";

import {
  buildProductConfiguration,
  getCompatibleAddons,
  getDefaultVariant,
  getVisibleVariants,
  isVariantOrderableForProduct,
  validateProductConfiguration,
} from "../utils/customizationModel.js";

export function useProductCustomization(product, onConfigured, initialConfiguration = null) {
  const [state, setState] = useState(() => ({
    catalogProduct: product,
    variantId: initialConfiguration?.productId === product.id
      ? initialConfiguration.variantId
      : getDefaultVariant(product)?.id || null,
    addonIds: initialConfiguration?.productId === product.id ? [...initialConfiguration.addonIds] : [],
    quantity: initialConfiguration?.productId === product.id && Number.isSafeInteger(initialConfiguration.quantity) && initialConfiguration.quantity > 0
      ? initialConfiguration.quantity
      : 1,
    submissionIssues: [],
    catalogNotice: "",
  }));

  const visibleVariants = useMemo(() => getVisibleVariants(product), [product]);
  const compatibleAddons = useMemo(() => getCompatibleAddons(product), [product]);
  if (state.catalogProduct !== product) {
    // Realtime/query refreshes can invalidate an open dialog. Reconcile selected
    // IDs before submission so a removed variant or add-on is not retained unseen.
    const currentVariant = visibleVariants.find((variant) => variant.id === state.variantId);
    const variantId = isVariantOrderableForProduct(product, currentVariant) ? state.variantId : null;
    const availableAddonIds = new Set(compatibleAddons.filter((addon) => addon.isAvailable).map((addon) => addon.id));
    const addonIds = state.addonIds.filter((id) => availableAddonIds.has(id));
    const variantChanged = Boolean(state.variantId && !variantId);
    const addonsChanged = addonIds.length !== state.addonIds.length;
    setState({
      ...state,
      catalogProduct: product,
      variantId,
      addonIds,
      submissionIssues: [],
      catalogNotice: variantChanged
        ? "Your meal option changed and must be selected again."
        : addonsChanged ? "An add-on changed and was removed from this selection." : state.catalogNotice,
    });
  }

  const { variantId, addonIds, quantity, submissionIssues, catalogNotice } = state;
  const validation = useMemo(
    () => validateProductConfiguration({ product, variantId, addonIds, quantity }),
    [product, variantId, addonIds, quantity],
  );
  const selectedVariant = visibleVariants.find((variant) => variant.id === variantId) || null;

  function chooseVariant(nextVariantId) {
    const variant = visibleVariants.find((item) => item.id === nextVariantId);
    if (!isVariantOrderableForProduct(product, variant)) return;
    setState((current) => ({ ...current, variantId: nextVariantId, submissionIssues: [], catalogNotice: "" }));
  }

  function toggleAddon(addonId) {
    const addon = compatibleAddons.find((item) => item.id === addonId);
    if (!addon?.isAvailable) return;
    setState((current) => ({
      ...current,
      addonIds: current.addonIds.includes(addonId)
        ? current.addonIds.filter((id) => id !== addonId)
        : [...current.addonIds, addonId],
      submissionIssues: [],
    }));
  }

  function decrementQuantity() {
    setState((current) => ({ ...current, quantity: Math.max(1, current.quantity - 1), submissionIssues: [] }));
  }

  function incrementQuantity() {
    setState((current) => ({ ...current, quantity: Number.isSafeInteger(current.quantity + 1) ? current.quantity + 1 : current.quantity, submissionIssues: [] }));
  }

  function submit() {
    const result = buildProductConfiguration({ product, variantId, addonIds, quantity });
    setState((current) => ({ ...current, submissionIssues: result.issues }));
    if (!result.valid) return result;
    onConfigured?.(result.configuration);
    return result;
  }

  return {
    variantId,
    addonIds,
    quantity,
    visibleVariants,
    compatibleAddons,
    selectedVariant,
    validation,
    submissionIssues,
    catalogNotice,
    chooseVariant,
    toggleAddon,
    decrementQuantity,
    incrementQuantity,
    submit,
  };
}
