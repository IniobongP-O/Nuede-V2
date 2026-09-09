import { koboToNairaInput } from "@nuede/domain/currency";
import { groupedProductOrderabilityMessage } from "@nuede/domain/catalog";
import { optionalNumber, parseNairaToKobo, slugifyProductName } from "@nuede/validation/catalog";

export const catalogStatusOptions = Object.freeze([
  { value: "all", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "sold_out", label: "Sold out" },
  { value: "price_pending", label: "Price pending" },
  { value: "hidden", label: "Hidden" },
  { value: "archived", label: "Archived" },
  { value: "unavailable", label: "Unavailable" },
]);

/** Converts editable text to the lowercase hyphenated base used for catalog slugs. */
export function slugify(value) {
  return slugifyProductName(value) || "item";
}

/** Maps a standard-product form to database columns and exact integer-kobo values. */
export function productFormToRecord(values) {
  const status = values.visibility === "shown" ? values.availability : values.visibility;
  return {
    category_id: values.categoryId,
    product_type: "standard",
    name: values.name.trim(),
    slug: values.slug?.trim() || "",
    description: values.description.trim(),
    price_kobo: values.priceNgn === "" ? null : parseNairaToKobo(values.priceNgn),
    calories: optionalNumber(values.calories),
    protein_g: optionalNumber(values.protein),
    carbohydrates_g: optionalNumber(values.carbohydrates),
    fat_g: optionalNumber(values.fat),
    status,
    requires_variant_selection: false,
    default_variant_id: null,
  };
}

/** Maps a grouped-product form to database columns and variant-selection rules. */
export function groupedProductFormToRecord(values) {
  return {
    category_id: values.categoryId,
    product_type: "grouped",
    name: values.name.trim(),
    slug: values.slug?.trim() || "",
    description: values.description.trim(),
    price_kobo: null,
    calories: null,
    protein_g: null,
    carbohydrates_g: null,
    fat_g: null,
    status: values.visibility === "shown" ? values.availability : values.visibility,
    requires_variant_selection: values.selectionMode === "required",
    default_variant_id: values.selectionMode === "automatic" ? values.defaultVariantId : null,
  };
}

/** Maps a standard product row into stable editor defaults. */
export function productToFormValues(product, defaultCategoryId = "") {
  const visibility = ["hidden", "archived"].includes(product?.status) ? product.status : "shown";
  const availability = visibility === "shown"
    ? product?.status || "available"
    : product?.price_kobo === null || product?.price_kobo === undefined
      ? "price_pending"
      : "available";

  return {
    name: product?.name || "",
    slug: product?.slug || "",
    categoryId: product?.category_id || defaultCategoryId,
    description: product?.description || "",
    priceNgn: koboToNairaInput(product?.price_kobo),
    calories: product?.calories?.toString() || "",
    protein: product?.protein_g?.toString() || "",
    carbohydrates: product?.carbohydrates_g?.toString() || "",
    fat: product?.fat_g?.toString() || "",
    availability,
    visibility,
    addonIds: product?.product_addon_assignments?.map((assignment) => assignment.addon_id) || [],
  };
}

/** Maps a grouped product row into editor defaults, including selection mode. */
export function groupedProductToFormValues(product, defaultCategoryId = "") {
  const visibility = ["hidden", "archived"].includes(product?.status) ? product.status : "shown";
  const availability = visibility === "shown" ? product?.status || "unavailable" : "unavailable";
  return {
    name: product?.name || "",
    slug: product?.slug || "",
    categoryId: product?.category_id || defaultCategoryId,
    description: product?.description || "",
    availability: ["available", "sold_out", "unavailable"].includes(availability) ? availability : "unavailable",
    visibility,
    selectionMode: product?.requires_variant_selection === false ? "automatic" : "required",
    defaultVariantId: product?.default_variant_id || "",
    addonIds: product?.product_addon_assignments?.map((assignment) => assignment.addon_id) || [],
  };
}

/** Maps a variant form to database columns and exact integer-kobo values. */
export function variantFormToRecord(values) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    price_kobo: values.priceNgn === "" ? null : parseNairaToKobo(values.priceNgn),
    calories: optionalNumber(values.calories),
    protein_g: optionalNumber(values.protein),
    carbohydrates_g: optionalNumber(values.carbohydrates),
    fat_g: optionalNumber(values.fat),
    status: values.visibility === "shown" ? values.availability : "hidden",
    sort_order: Number(values.sortOrder),
  };
}

/** Maps an optional variant row into editor defaults for create or update. */
export function variantToFormValues(variant, nextSortOrder = 10) {
  const visibility = variant?.status === "hidden" ? "hidden" : "shown";
  return {
    name: variant?.name || "",
    description: variant?.description || "",
    priceNgn: koboToNairaInput(variant?.price_kobo),
    calories: variant?.calories?.toString() || "",
    protein: variant?.protein_g?.toString() || "",
    carbohydrates: variant?.carbohydrates_g?.toString() || "",
    fat: variant?.fat_g?.toString() || "",
    availability: visibility === "shown" ? variant?.status || "unavailable" : "unavailable",
    visibility,
    sortOrder: String(variant?.sort_order ?? nextSortOrder),
  };
}

/** Maps an add-on form to database columns and exact integer-kobo values. */
export function addonFormToRecord(values) {
  return {
    name: values.name.trim(),
    price_kobo: parseNairaToKobo(values.priceNgn),
    calories: optionalNumber(values.calories),
    protein_g: optionalNumber(values.protein),
    carbohydrates_g: optionalNumber(values.carbohydrates),
    fat_g: optionalNumber(values.fat),
    is_available: values.isAvailable,
  };
}

/** Maps an optional add-on row into editor defaults for create or update. */
export function addonToFormValues(addon) {
  return {
    name: addon?.name || "",
    priceNgn: koboToNairaInput(addon?.price_kobo),
    calories: addon?.calories?.toString() || "",
    protein: addon?.protein_g?.toString() || "",
    carbohydrates: addon?.carbohydrates_g?.toString() || "",
    fat: addon?.fat_g?.toString() || "",
    isAvailable: addon?.is_available ?? true,
  };
}

/** Applies admin catalog search, category, status, and product-type filters. */
export function filterProducts(products, { search = "", category = "all", status = "all", type = "all" }) {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  return products.filter((product) => {
    const matchesSearch = normalizedSearch === ""
      || product.name.toLocaleLowerCase().includes(normalizedSearch);
    const matchesCategory = category === "all" || product.category_id === category;
    const matchesStatus = status === "all" || product.status === status;
    const matchesType = type === "all" || product.product_type === type;
    return matchesSearch && matchesCategory && matchesStatus && matchesType;
  });
}

/** Resolves a requested admin action to the next permitted product status. */
export function nextProductStatus(product, action) {
  if (action === "mark_available") {
    if (product.product_type === "grouped") {
      const validationMessage = groupedProductOrderabilityMessage(
        { ...product, status: "available" },
        product.product_variants,
      );
      if (validationMessage) throw new Error(validationMessage);
    } else if (product.price_kobo === null || product.price_kobo === undefined) {
      throw new Error("Add a price before marking this product available.");
    }
    return "available";
  }
  if (action === "mark_sold_out") {
    if (product.product_type === "standard" && (product.price_kobo === null || product.price_kobo === undefined)) {
      throw new Error("Add a price before marking this product sold out.");
    }
    return "sold_out";
  }
  if (action === "hide") return "hidden";
  if (action === "show") {
    if (product.product_type === "grouped") {
      const candidate = { ...product, status: "available" };
      return groupedProductOrderabilityMessage(candidate, product.product_variants) ? "unavailable" : "available";
    }
    return product.price_kobo === null || product.price_kobo === undefined ? "price_pending" : "available";
  }
  if (action === "archive") return "archived";
  if (action === "restore") return "hidden";
  throw new Error("Choose a valid status action.");
}

/** Translates database/catalog failures into actionable admin-facing copy. */
export function catalogErrorMessage(error) {
  if (error?.code === "23505") return "That name is already in use. Choose a different name.";
  if (error?.code === "23503") return "This change is blocked because related catalog records still reference it.";
  if (error?.code === "23514") return error.message || "The catalog change conflicts with a database rule. Review the entered values.";
  if (["42501", "PGRST301"].includes(error?.code)) return "Your session is not authorized to make this catalog change.";
  return error?.message || "The catalog operation could not be completed.";
}
