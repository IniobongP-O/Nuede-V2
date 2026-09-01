import { z } from "zod";

const stableCatalogIdSchema = z.string().uuid("Use a valid catalog ID.");

export const productConfigurationSchema = z.object({
  productId: stableCatalogIdSchema,
  variantId: stableCatalogIdSchema.nullable(),
  addonIds: z.array(stableCatalogIdSchema),
  quantity: z.number().int().positive(),
}).superRefine((configuration, context) => {
  if (new Set(configuration.addonIds).size !== configuration.addonIds.length) {
    context.addIssue({
      code: "custom",
      path: ["addonIds"],
      message: "Add-on IDs must be unique.",
    });
  }
});
