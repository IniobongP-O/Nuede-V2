import { checkoutSubmissionSchema } from "../../../../packages/validation/src/checkout.js";

import { OrderError } from "./errors.js";

export { checkoutSubmissionSchema };

/** Parses the untrusted browser payload into the strict shared checkout contract. */
export function parseCheckoutRequest(candidate) {
  const result = checkoutSubmissionSchema.safeParse(candidate);
  if (result.success) return result.data;

  throw new OrderError("INVALID_REQUEST", "Check the submitted order details and try again.", {
    status: 400,
    stage: "request",
    details: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}
