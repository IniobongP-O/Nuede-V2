import { formatKobo } from "../../../../packages/domain/src/currency.js";

import { OrderError } from "../order/errors.js";
import { persistenceItems } from "../order/persistence.js";
import { normalizeWhatsappRecipient } from "../whatsapp.js";

/** Creates the standard database-stage error for payment persistence failures. */
function persistenceFailure(message, cause) {
  return new OrderError("PAYMENT_PERSISTENCE_FAILED", message, { status: 500, stage: "payment_persistence", cause });
}

/** Persists the order and its pending Paystack attempt in one transaction. */
export async function persistPaystackOrderAtomically(client, snapshot, reference) {
  // The order and pending attempt must either both exist or neither exist. This
  // permanent record is created before contacting hosted checkout so later
  // webhook/verification events always reconcile against a known amount.
  const { data, error } = await client.rpc("create_paystack_order_atomic", {
    p_order: snapshot.order,
    p_items: persistenceItems(snapshot.items),
    p_provider_reference: reference,
  });
  if (["PAYSTACK_DISABLED", "PAYMENT_METHOD_DISABLED"].includes(error?.message)) {
    throw new OrderError("PAYMENT_METHOD_DISABLED", "Paystack is not currently available.", { status: 422, stage: "business_validation", cause: error });
  }
  if (error || !data?.order_id || !data?.order_reference || !data?.payment_id || data?.provider_reference !== reference) {
    throw persistenceFailure("The order and payment attempt could not be saved. Please try again.", error);
  }
  return data;
}

/** Records initialization failure without overwriting a concurrently paid attempt. */
export async function failPaystackInitialization(client, reference, failureCode = "initialization_failed") {
  const { data, error } = await client.rpc("record_paystack_initialization_failure_atomic", {
    p_provider_reference: reference,
    p_failure_code: failureCode,
  });
  if (error || !["pending", "paid"].includes(data?.status)) throw persistenceFailure("The failed initialization could not be recorded safely.", error);
}

/** Idempotently applies a provider transaction to its local payment and order. */
export async function reconcilePaystackPayment(client, transaction) {
  // Webhooks and browser-triggered verification deliberately share the same
  // locked RPC, making duplicate or concurrent provider events idempotent.
  const { data, error } = await client.rpc("reconcile_paystack_payment_atomic", {
    p_provider_reference: transaction.reference,
    p_provider_status: transaction.status,
    p_provider_amount_kobo: transaction.amount,
    p_provider_currency: transaction.currency,
    p_provider_transaction_id: transaction.id || null,
    p_occurred_at: transaction.paid_at || new Date().toISOString(),
  });
  if (error) throw persistenceFailure("The payment could not be reconciled safely.", error);
  return data;
}

/** Loads one Paystack attempt together with the status of its owning order. */
export async function loadPaystackPayment(client, reference) {
  const { data, error } = await client.from("payments")
    .select("id,order_id,amount_kobo,status,verification_status,provider_reference,failure_code,orders!inner(order_reference,payment_status,fulfilment_status,total_kobo)")
    .eq("provider", "paystack")
    .eq("provider_reference", reference)
    .maybeSingle();
  if (error) throw persistenceFailure("The payment status could not be loaded.", error);
  return data || null;
}

/** Converts stored integer-kobo representations to a safe number or null. */
function safeKobo(value) {
  const numeric = typeof value === "string" ? Number(value) : value;
  return Number.isSafeInteger(numeric) && numeric >= 0 ? numeric : null;
}

/** Builds an optional WhatsApp follow-up for a payment proven to be paid. */
export function buildPaidWhatsappHandoff(result, recipient) {
  if (!recipient) return null;
  try {
    const normalized = normalizeWhatsappRecipient(recipient);
    const message = [
      `Nuede Order ${result.orderReference}`,
      `Paystack reference: ${result.paymentReference}`,
      `Paid amount: ${formatKobo(result.amountKobo)}`,
      "Payment status: Confirmed",
      "",
      "Hello Nuede, my Paystack payment has been verified. Please help me with the next steps for this order.",
    ].join("\n");
    return { message, url: `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` };
  } catch {
    return null;
  }
}

/** Derives the public payment state from the payment row and matching order state. */
export function normalizePaymentResult(row, { statusOverride, whatsappRecipient } = {}) {
  if (!row) return null;
  const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
  const amountKobo = safeKobo(row.amount_kobo);
  if (!order?.order_reference || amountKobo === null) throw persistenceFailure("The payment status record is invalid.");
  let status = statusOverride;
  if (!status) {
    // A Paystack success is exposed as paid only when the attempt is verified and
    // the order agrees. Redirect/query-string state alone can never satisfy this.
    if (row.status === "paid" && row.verification_status === "verified" && order.payment_status === "paid") status = "paid";
    else if (row.status === "failed" || row.verification_status === "failed" || order.payment_status === "failed") status = "failed";
    else status = "pending";
  }
  const result = {
    status,
    orderReference: order.order_reference,
    paymentReference: row.provider_reference,
    amountKobo,
    paymentStatus: order.payment_status,
    fulfilmentStatus: order.fulfilment_status,
  };
  return { ...result, whatsapp: status === "paid" ? buildPaidWhatsappHandoff(result, whatsappRecipient) : null };
}
