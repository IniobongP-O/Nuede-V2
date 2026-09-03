import { z } from "zod";

const stableCatalogIdSchema = z.string().uuid("Use a valid catalog ID.");

function isCalendarDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export const plannerDurationSchema = z.number().int().min(2).max(7);
export const plannerDateSchema = z.string().refine(isCalendarDate, "Use a valid calendar date.");
export const plannerConfigurationSchema = z.object({
  productId: stableCatalogIdSchema,
  variantId: stableCatalogIdSchema.nullable(),
  addonIds: z.array(stableCatalogIdSchema).max(100),
  quantity: z.literal(1),
}).superRefine((configuration, context) => {
  if (new Set(configuration.addonIds).size !== configuration.addonIds.length) {
    context.addIssue({ code: "custom", path: ["addonIds"], message: "Add-on IDs must be unique." });
  }
});

export const plannerSlotsSchema = z.object({
  breakfast: plannerConfigurationSchema.nullable(),
  lunch: plannerConfigurationSchema.nullable(),
  dinner: plannerConfigurationSchema.nullable(),
  snack: plannerConfigurationSchema.nullable(),
}).strict();

export const plannerDaySchema = z.object({
  date: plannerDateSchema,
  slots: plannerSlotsSchema,
}).strict();

export const plannerStorageEnvelopeSchema = z.object({
  version: z.literal(1),
  durationDays: plannerDurationSchema,
  startDate: plannerDateSchema,
  days: z.array(z.unknown()).max(7),
}).strict();
