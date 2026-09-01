import { z } from "zod";

export const savedMealIdSchema = z.string().uuid("Use a valid meal ID.");
export const savedMealsStorageSchema = z.array(z.unknown()).max(500);
