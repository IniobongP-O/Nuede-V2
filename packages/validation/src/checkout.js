import { z } from "zod";

import { productConfigurationSchema } from "./customization.js";
import { plannerConfigurationSchema, plannerDateSchema, plannerDurationSchema } from "./planner.js";

const stableIdSchema = z.string().uuid("Choose a valid option.");
const optionalTrimmed = (maximum) => z.string().trim().max(maximum);

function addCalendarDays(calendarDate, amount) {
  const [year, month, day] = calendarDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export const paymentMethodSchema = z.enum(["paystack", "whatsapp"]);

export const customerDeliverySchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120, "Keep your name under 120 characters."),
  phone: z.string().trim().min(7, "Enter a phone number we can reach.").max(30, "Keep the phone number under 30 characters."),
  email: optionalTrimmed(254).refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email address."),
  address: z.string().trim().min(8, "Enter a complete delivery address.").max(500, "Keep the address under 500 characters."),
  landmark: optionalTrimmed(200),
}).strict();

export const checkoutFormSchema = customerDeliverySchema.extend({
  deliveryZoneId: stableIdSchema,
  paymentMethod: paymentMethodSchema,
}).superRefine((value, context) => {
  if (value.paymentMethod === "paystack" && !value.email) {
    context.addIssue({ code: "custom", path: ["email"], message: "Enter an email address to pay securely with Paystack." });
  }
});

export const deliveryZoneAdminFormSchema = z.object({
  feeNgn: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter a non-negative NGN amount with no more than two decimal places."),
});

export const checkoutSettingsFormSchema = z.object({
  paystackEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
}).refine((value) => value.paystackEnabled || value.whatsappEnabled, {
  path: ["root"],
  message: "Keep at least one payment method enabled.",
});

const cartContractSchema = z.object({
  orderType: z.literal("cart"),
  customer: customerDeliverySchema,
  deliveryZoneId: stableIdSchema,
  paymentMethod: paymentMethodSchema,
  items: z.array(productConfigurationSchema).min(1, "The basket must contain at least one item."),
}).strict();

const mealPlanContractSchema = z.object({
  orderType: z.literal("meal_plan"),
  customer: customerDeliverySchema,
  deliveryZoneId: stableIdSchema,
  paymentMethod: paymentMethodSchema,
  durationDays: plannerDurationSchema,
  startDate: plannerDateSchema,
  days: z.array(z.object({
    date: plannerDateSchema,
    slots: z.object({
      breakfast: plannerConfigurationSchema.nullable(),
      lunch: plannerConfigurationSchema.nullable(),
      dinner: plannerConfigurationSchema.nullable(),
      snack: plannerConfigurationSchema.nullable(),
    }).strict(),
  }).strict()).min(2).max(7),
}).strict().superRefine((value, context) => {
  const occupied = value.days.some((day) => Object.values(day.slots).some(Boolean));
  if (!occupied) context.addIssue({ code: "custom", path: ["days"], message: "The meal plan must contain at least one meal." });
  if (value.days.length !== value.durationDays) {
    context.addIssue({ code: "custom", path: ["days"], message: "The meal-plan days must match its duration." });
  }
  value.days.forEach((day, index) => {
    if (day.date !== addCalendarDays(value.startDate, index)) {
      context.addIssue({ code: "custom", path: ["days", index, "date"], message: "Meal-plan dates must be consecutive from the start date." });
    }
  });
});

export const checkoutSubmissionSchema = z.discriminatedUnion("orderType", [cartContractSchema, mealPlanContractSchema]).superRefine((value, context) => {
  if (value.paymentMethod === "paystack" && !value.customer.email) {
    context.addIssue({ code: "custom", path: ["customer", "email"], message: "An email address is required for Paystack." });
  }
});
