import { z } from "zod";

export const paystackReferenceSchema = z.string().trim().min(6).max(100).regex(/^[A-Za-z0-9.=-]+$/);

const transactionIdSchema = z.union([
  z.number().int().nonnegative().transform((value) => Number.isSafeInteger(value) ? String(value) : undefined),
  z.string().regex(/^\d{1,20}$/),
]);

export const paystackTransactionSchema = z.object({
  id: transactionIdSchema.optional(),
  status: z.string().trim().min(1).max(40),
  reference: paystackReferenceSchema,
  amount: z.number().int().nonnegative().safe(),
  currency: z.string().trim().min(3).max(3),
  paid_at: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();

export const paystackInitializeResponseSchema = z.object({
  status: z.literal(true),
  data: z.object({
    authorization_url: z.url(),
    access_code: z.string().trim().min(1).max(200),
    reference: paystackReferenceSchema,
  }),
}).passthrough();

export const paystackVerifyResponseSchema = z.object({
  status: z.literal(true),
  data: paystackTransactionSchema,
}).passthrough();

export const paystackWebhookEnvelopeSchema = z.object({
  event: z.string().trim().min(1).max(100),
  data: z.unknown(),
}).passthrough();

export const paystackWebhookSchema = z.object({
  event: z.string().trim().min(1).max(100),
  data: paystackTransactionSchema,
}).passthrough();

export const paymentVerificationRequestSchema = z.object({
  reference: paystackReferenceSchema,
}).strict();
