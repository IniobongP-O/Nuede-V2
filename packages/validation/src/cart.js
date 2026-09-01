import { z } from "zod";

const stableCatalogIdSchema = z.string().uuid("Use a valid catalog ID.");

export const cartItemStorageSchema = z.object({
  productId: stableCatalogIdSchema,
  variantId: stableCatalogIdSchema.nullable(),
  addonIds: z.array(stableCatalogIdSchema).max(100),
  quantity: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
});

export const cartStorageSchema = z.object({
  version: z.literal(1),
  items: z.array(z.unknown()).max(500),
});
