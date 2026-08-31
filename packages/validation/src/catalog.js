import { z } from "zod";

const moneyPattern = /^\d+(\.\d{1,2})?$/;
const decimalPattern = /^\d+(\.\d{1,2})?$/;
const integerPattern = /^\d+$/;
const maximumSafeKobo = BigInt(Number.MAX_SAFE_INTEGER);

export const productAvailabilityValues = Object.freeze([
  "available",
  "sold_out",
  "price_pending",
  "unavailable",
]);

export const productVisibilityValues = Object.freeze(["shown", "hidden", "archived"]);

export function parseNairaToKobo(value) {
  const normalized = String(value ?? "").trim();
  if (!moneyPattern.test(normalized)) {
    throw new Error("Enter a non-negative NGN amount with no more than two decimal places.");
  }

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
  name: z.string().trim().min(1, "Enter a product name.").max(120, "Use 120 characters or fewer."),
  categoryId: z.string().uuid("Select a category."),
  description: z.string().trim().max(2_000, "Use 2,000 characters or fewer."),
  priceNgn: z.string().trim().refine(
    (value) => value === "" || moneyPattern.test(value),
    "Enter a non-negative NGN amount with no more than two decimal places.",
  ),
  calories: z.string().trim().refine(
    (value) => value === "" || integerPattern.test(value),
    "Enter a whole number of zero or more.",
  ),
  protein: optionalDecimal,
  carbohydrates: optionalDecimal,
  fat: optionalDecimal,
  availability: z.enum(productAvailabilityValues),
  visibility: z.enum(productVisibilityValues),
}).superRefine((values, context) => {
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

export function optionalNumber(value) {
  return value === "" ? null : Number(value);
}
