import { koboToNairaInput } from "@nuede/domain/currency";
import { optionalNumber, parseNairaToKobo } from "@nuede/validation/catalog";

export const catalogStatusOptions = Object.freeze([
  { value: "all", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "sold_out", label: "Sold out" },
  { value: "price_pending", label: "Price pending" },
  { value: "hidden", label: "Hidden" },
  { value: "archived", label: "Archived" },
  { value: "unavailable", label: "Unavailable" },
]);

export function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

export function productFormToRecord(values) {
  const status = values.visibility === "shown" ? values.availability : values.visibility;
  return {
    category_id: values.categoryId,
    product_type: "standard",
    name: values.name.trim(),
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

export function productToFormValues(product, defaultCategoryId = "") {
  const visibility = ["hidden", "archived"].includes(product?.status) ? product.status : "shown";
  const availability = visibility === "shown"
    ? product?.status || "available"
    : product?.price_kobo === null || product?.price_kobo === undefined
      ? "price_pending"
      : "available";

  return {
    name: product?.name || "",
    categoryId: product?.category_id || defaultCategoryId,
    description: product?.description || "",
    priceNgn: koboToNairaInput(product?.price_kobo),
    calories: product?.calories?.toString() || "",
    protein: product?.protein_g?.toString() || "",
    carbohydrates: product?.carbohydrates_g?.toString() || "",
    fat: product?.fat_g?.toString() || "",
    availability,
    visibility,
  };
}

export function filterProducts(products, { search = "", category = "all", status = "all" }) {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  return products.filter((product) => {
    const matchesSearch = normalizedSearch === ""
      || product.name.toLocaleLowerCase().includes(normalizedSearch);
    const matchesCategory = category === "all" || product.category_id === category;
    const matchesStatus = status === "all" || product.status === status;
    return matchesSearch && matchesCategory && matchesStatus;
  });
}

export function nextProductStatus(product, action) {
  if (action === "mark_available") {
    if (product.price_kobo === null || product.price_kobo === undefined) {
      throw new Error("Add a price before marking this product available.");
    }
    return "available";
  }
  if (action === "mark_sold_out") {
    if (product.price_kobo === null || product.price_kobo === undefined) {
      throw new Error("Add a price before marking this product sold out.");
    }
    return "sold_out";
  }
  if (action === "hide") return "hidden";
  if (action === "show") return product.price_kobo === null || product.price_kobo === undefined
    ? "price_pending"
    : "available";
  if (action === "archive") return "archived";
  if (action === "restore") return "hidden";
  throw new Error("Choose a valid status action.");
}

export function catalogErrorMessage(error) {
  if (error?.code === "23505") return "That name is already in use. Choose a different name.";
  if (error?.code === "23503") return "This change is blocked because related catalog records still reference it.";
  if (error?.code === "23514") return "The catalog change conflicts with a database rule. Review the entered values.";
  if (["42501", "PGRST301"].includes(error?.code)) return "Your session is not authorized to make this catalog change.";
  return error?.message || "The catalog operation could not be completed.";
}
