import { z } from "zod";

const moneyPattern = /^\d+(\.\d{1,2})?$/;
const decimalPattern = /^\d+(\.\d{1,2})?$/;
const integerPattern = /^\d+$/;
const maximumSafeKobo = BigInt(Number.MAX_SAFE_INTEGER);

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
  (value) => value === "" || integerPattern.test(value),
  "Enter a whole number of zero or more.",
);
const addonIdsSchema = z.array(uuidSchema).max(100, "Select no more than 100 add-ons.").default([]);

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

export function optionalNumber(value) {
  return value === "" ? null : Number(value);
}
