import { z } from "zod";

const moneyPattern = /^\d+(\.\d{1,2})?$/;
const decimalPattern = /^\d+(\.\d{1,2})?$/;
const integerPattern = /^\d+$/;
const maximumSafeKobo = BigInt(Number.MAX_SAFE_INTEGER);

export const reservedProductSlugs = Object.freeze([
  "menu", "saved", "planner", "checkout", "payment", "about", "faq", "contact", "delivery", "meal-plans", "high-protein-meals",
]);
export const productSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Derives the stable public slug proposed when a meal is first created. */
export function slugifyProductName(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120).replace(/-+$/g, "");
}

/** Adds the first available numeric suffix without changing an already unique base. */
export function uniqueSlugCandidate(base, usedSlugs = []) {
  if (!base) return "";
  const used = new Set(usedSlugs);
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export const productSlugSchema = z.string().trim().min(1, "Enter a public URL slug.").max(120, "Use 120 characters or fewer.").refine(
  (value) => productSlugPattern.test(value),
  "Use lowercase letters, numbers, and single hyphens only.",
).refine((value) => !reservedProductSlugs.includes(value), "Choose a slug that does not conflict with a storefront route.");
const optionalProductSlugSchema = z.union([z.literal(""), productSlugSchema]).default("");

export const catalogImageBucket = "product-images";
export const catalogImageMaximumBytes = 5 * 1024 * 1024;
export const catalogImageTypes = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const productAvailabilityValues = Object.freeze([
  "available",
  "sold_out",
  "price_pending",
  "unavailable",
]);

export const productVisibilityValues = Object.freeze(["shown", "hidden", "archived"]);
export const variantAvailabilityValues = Object.freeze(["available", "sold_out", "unavailable"]);
export const variantVisibilityValues = Object.freeze(["shown", "hidden"]);

const uuidSchema = z.string().uuid("Select a valid catalog record.");
const nameSchema = (label) => z.string().trim().min(1, `Enter ${label}.`).max(120, "Use 120 characters or fewer.");
const descriptionSchema = z.string().trim().max(2_000, "Use 2,000 characters or fewer.");
const moneyInputSchema = z.string().trim().refine(
  (value) => value === "" || moneyPattern.test(value),
  "Enter a non-negative NGN amount with no more than two decimal places.",
);
const caloriesInputSchema = z.string().trim().refine(
  (value) => value === "" || decimalPattern.test(value),
  "Enter a non-negative calorie value with no more than two decimal places.",
);
const addonIdsSchema = z.array(uuidSchema).max(100, "Select no more than 100 add-ons.").default([]);

/**
 * Converts an admin-entered NGN decimal to exact integer kobo.
 * Throws when the text is malformed or cannot be represented safely.
 */
export function parseNairaToKobo(value) {
  const normalized = String(value ?? "").trim();
  if (!moneyPattern.test(normalized)) {
    throw new Error("Enter a non-negative NGN amount with no more than two decimal places.");
  }

  // Parse decimal text as digits instead of multiplying a JavaScript float;
  // rounding at this boundary would corrupt the integer-kobo source of truth.
  const [wholeNaira, fractionalNaira = ""] = normalized.split(".");
  const kobo = (BigInt(wholeNaira) * 100n) + BigInt(fractionalNaira.padEnd(2, "0"));
  if (kobo > maximumSafeKobo) {
    throw new Error("The price is too large to process safely.");
  }

  return Number(kobo);
}

const optionalDecimal = z.string().trim().refine(
  (value) => value === "" || decimalPattern.test(value),
  "Enter a non-negative number with no more than two decimal places.",
);

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a category name.").max(80, "Use 80 characters or fewer."),
  sortOrder: z.string().trim().regex(integerPattern, "Enter a whole number of zero or more."),
});

export const productFormSchema = z.object({
  name: nameSchema("a product name"),
  slug: optionalProductSlugSchema,
  categoryId: uuidSchema,
  description: descriptionSchema,
  priceNgn: moneyInputSchema,
  calories: caloriesInputSchema,
  protein: optionalDecimal,
  carbohydrates: optionalDecimal,
  fat: optionalDecimal,
  availability: z.enum(productAvailabilityValues),
  visibility: z.enum(productVisibilityValues),
  addonIds: addonIdsSchema,
}).superRefine((values, context) => {
  // These paired rules keep the UI representation compatible with database
  // constraints: orderable states have a price, while price_pending has none.
  if (["available", "sold_out"].includes(values.availability) && values.priceNgn === "") {
    context.addIssue({
      code: "custom",
      path: ["priceNgn"],
      message: "Available and sold-out products require a price.",
    });
  }

  if (values.availability === "price_pending" && values.priceNgn !== "") {
    context.addIssue({
      code: "custom",
      path: ["priceNgn"],
      message: "Clear the price while availability is Price pending.",
    });
  }
});

export const groupedProductFormSchema = z.object({
  name: nameSchema("a grouped meal name"),
  slug: optionalProductSlugSchema,
  categoryId: uuidSchema,
  description: descriptionSchema,
  availability: z.enum(variantAvailabilityValues),
  visibility: z.enum(productVisibilityValues),
  selectionMode: z.enum(["automatic", "required"]),
  defaultVariantId: z.union([z.literal(""), uuidSchema]),
  addonIds: addonIdsSchema,
}).superRefine((values, context) => {
  // Automatic selection is only meaningful when it resolves to an explicit
  // default; the database separately verifies that variant belongs to the group.
  if (values.selectionMode === "automatic" && values.defaultVariantId === "") {
    context.addIssue({
      code: "custom",
      path: ["defaultVariantId"],
      message: "Choose an available default variant for automatic selection.",
    });
  }
});

export const variantFormSchema = z.object({
  name: nameSchema("a variant name"),
  description: descriptionSchema,
  priceNgn: moneyInputSchema,
  calories: caloriesInputSchema,
  protein: optionalDecimal,
  carbohydrates: optionalDecimal,
  fat: optionalDecimal,
  availability: z.enum(variantAvailabilityValues),
  visibility: z.enum(variantVisibilityValues),
  sortOrder: z.string().trim().regex(integerPattern, "Enter a whole number of zero or more."),
}).superRefine((values, context) => {
  if (["available", "sold_out"].includes(values.availability) && values.priceNgn === "") {
    context.addIssue({
      code: "custom",
      path: ["priceNgn"],
      message: "Available and sold-out variants require a price.",
    });
  }
});

export const addonFormSchema = z.object({
  name: nameSchema("an add-on name"),
  priceNgn: moneyInputSchema.refine((value) => value !== "", "Enter an add-on price."),
  calories: caloriesInputSchema,
  protein: optionalDecimal,
  carbohydrates: optionalDecimal,
  fat: optionalDecimal,
  isAvailable: z.boolean(),
});

/** Returns the customer-facing rejection reason for an image, or `null` if valid. */
export function catalogImageValidationMessage(file) {
  if (!file) return null;
  if (!catalogImageTypes.includes(file.type)) {
    return "Choose a JPEG, PNG, WebP, or AVIF image.";
  }
  if (!Number.isInteger(file.size) || file.size <= 0) {
    return "The selected image is empty or invalid.";
  }
  if (file.size > catalogImageMaximumBytes) {
    return "Choose an image no larger than 5 MB.";
  }
  return null;
}

/** Converts an optional numeric form field to a number while preserving blank as null. */
export function optionalNumber(value) {
  return value === "" ? null : Number(value);
}
