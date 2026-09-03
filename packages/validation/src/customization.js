import { z } from "zod";

const stableCatalogIdSchema = z.string().uuid("Use a valid catalog ID.");
// PostgreSQL order_items.quantity is a signed integer, so validation rejects
// values that JavaScript could represent but the persistence layer cannot.
const databaseQuantitySchema = z.number().int().positive().max(2_147_483_647);

export const productConfigurationSchema = z.object({
  productId: stableCatalogIdSchema,
  variantId: stableCatalogIdSchema.nullable(),
  addonIds: z.array(stableCatalogIdSchema).max(100),
  quantity: databaseQuantitySchema,
}).superRefine((configuration, context) => {
  // Duplicate IDs would charge and snapshot the same add-on more than once.
  if (new Set(configuration.addonIds).size !== configuration.addonIds.length) {
    context.addIssue({
      code: "custom",
      path: ["addonIds"],
      message: "Add-on IDs must be unique.",
    });
  }
}).strict();
