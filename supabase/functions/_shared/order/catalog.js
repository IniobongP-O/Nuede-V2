import { OrderError } from "./errors.js";
import { collectSelectionIds } from "./request.js";

const PRODUCT_COLUMNS = "id,name,product_type,price_kobo,calories,protein_g,carbohydrates_g,fat_g,status,requires_variant_selection,default_variant_id";
const VARIANT_COLUMNS = "id,product_id,name,price_kobo,calories,protein_g,carbohydrates_g,fat_g,status";
const ADDON_COLUMNS = "id,name,price_kobo,calories,protein_g,carbohydrates_g,fat_g,is_available";

function noRows() {
  return Promise.resolve({ data: [], error: null });
}

function throwCatalogFailure(error) {
  throw new OrderError("ORDER_CREATION_FAILED", "Current menu details could not be checked. Please try again.", {
    status: 500,
    stage: "catalog",
    cause: error,
  });
}

export async function loadOrderContext(client, request, items) {
  const { productIds, variantIds, addonIds } = collectSelectionIds(items);
  // The Edge Function uses a service-role client so it can distinguish missing,
  // hidden, and unavailable records without weakening anonymous catalog RLS.
  // Unique IDs are fetched in batches to avoid an N+1 query per order line.
  const productsQuery = productIds.length
    ? client.from("products").select(PRODUCT_COLUMNS).in("id", productIds)
    : noRows();
  const variantsQuery = variantIds.length
    ? client.from("product_variants").select(VARIANT_COLUMNS).in("id", variantIds)
    : noRows();
  const addonsQuery = addonIds.length
    ? client.from("product_addons").select(ADDON_COLUMNS).in("id", addonIds)
    : noRows();
  const assignmentsQuery = addonIds.length
    ? client.from("product_addon_assignments").select("product_id,addon_id").in("product_id", productIds).in("addon_id", addonIds)
    : noRows();

  const [products, variants, addons, assignments, deliveryZone, checkoutSettings] = await Promise.all([
    productsQuery,
    variantsQuery,
    addonsQuery,
    assignmentsQuery,
    client.from("delivery_zones").select("id,name,fee_kobo,is_active").eq("id", request.deliveryZoneId).maybeSingle(),
    client.from("checkout_settings").select("paystack_enabled,whatsapp_enabled").eq("id", true).maybeSingle(),
  ]);

  const failed = [products, variants, addons, assignments, deliveryZone, checkoutSettings].find((result) => result.error);
  if (failed) throwCatalogFailure(failed.error);

  return {
    products: products.data || [],
    variants: variants.data || [],
    addons: addons.data || [],
    assignments: assignments.data || [],
    deliveryZone: deliveryZone.data || null,
    checkoutSettings: checkoutSettings.data || null,
  };
}

function safeKobo(value) {
  const number = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function selectionError(code, message) {
  return new OrderError(code, message, { status: 422, stage: "business_validation" });
}

export function validateOrderContext(request, items, context) {
  // Payment availability and delivery fees are checked from the same current
  // backend snapshot used for pricing; the browser's checkout screen is only a
  // convenience preview and may have gone stale before submission.
  const settingsKey = request.paymentMethod === "paystack" ? "paystack_enabled" : "whatsapp_enabled";
  if (!context.checkoutSettings?.[settingsKey]) {
    throw selectionError("PAYMENT_METHOD_DISABLED", "That payment method is not currently available.");
  }

  if (!context.deliveryZone || context.deliveryZone.is_active !== true || safeKobo(context.deliveryZone.fee_kobo) === null) {
    throw selectionError("DELIVERY_ZONE_UNAVAILABLE", "That delivery area is not currently available.");
  }

  const productsById = new Map(context.products.map((row) => [row.id, row]));
  const variantsById = new Map(context.variants.map((row) => [row.id, row]));
  const addonsById = new Map(context.addons.map((row) => [row.id, row]));
  const assignments = new Set(context.assignments.map((row) => `${row.product_id}:${row.addon_id}`));

  const resolvedItems = items.map((sourceItem) => {
    const { configuration } = sourceItem;
    const product = productsById.get(configuration.productId);
    if (!product || product.status !== "available") {
      throw selectionError("PRODUCT_NOT_AVAILABLE", "A selected meal is no longer available.");
    }

    let variant = null;
    let basePriceKobo = safeKobo(product.price_kobo);
    if (product.product_type === "grouped") {
      // Even groups with an automatic storefront default submit the concrete
      // variant ID. This makes the purchased base unambiguous in the snapshot.
      if (!configuration.variantId) {
        throw selectionError("INVALID_VARIANT", "Choose an available option for every grouped meal.");
      }
      variant = variantsById.get(configuration.variantId);
      if (!variant || variant.product_id !== product.id) {
        throw selectionError("INVALID_VARIANT", "A selected meal option does not belong to that meal.");
      }
      basePriceKobo = safeKobo(variant.price_kobo);
      if (variant.status !== "available" || basePriceKobo === null) {
        throw selectionError("VARIANT_NOT_AVAILABLE", "A selected meal option is no longer available.");
      }
    } else {
      if (configuration.variantId !== null) {
        throw selectionError("INVALID_VARIANT", "A standard meal cannot use a meal variant.");
      }
      if (product.product_type !== "standard" || basePriceKobo === null) {
        throw selectionError("PRODUCT_NOT_AVAILABLE", "A selected meal is not currently orderable.");
      }
    }

    const selectedAddons = configuration.addonIds.map((addonId) => {
      const addon = addonsById.get(addonId);
      if (!addon) throw selectionError("INVALID_ADDON", "A selected add-on does not exist.");
      if (!assignments.has(`${product.id}:${addonId}`)) {
        // Existence alone is insufficient: compatibility is product-specific
        // and must be rechecked to prevent crafted cross-product selections.
        throw selectionError("INVALID_ADDON", "A selected add-on is not offered with that meal.");
      }
      if (addon.is_available !== true || safeKobo(addon.price_kobo) === null) {
        throw selectionError("ADDON_NOT_AVAILABLE", "A selected add-on is no longer available.");
      }
      return addon;
    });

    return {
      ...sourceItem,
      product,
      variant,
      addons: selectedAddons,
      basePriceKobo,
    };
  });

  return {
    deliveryZone: { ...context.deliveryZone, feeKobo: safeKobo(context.deliveryZone.fee_kobo) },
    items: resolvedItems,
  };
}
