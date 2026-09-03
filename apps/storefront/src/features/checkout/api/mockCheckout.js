import { checkoutSubmissionSchema } from "@nuede/validation/checkout";

export async function submitCheckoutMock(contract) {
  const parsed = checkoutSubmissionSchema.parse(contract);
  await Promise.resolve();
  return Object.freeze({ accepted: true, contract: parsed });
}
