import { BadgeCheck } from "lucide-react";
import { useState } from "react";

import { formatKobo } from "@nuede/domain/currency";
import { Button } from "../../../components/ui/Button.jsx";
import { Dialog } from "../../../components/ui/Dialog.jsx";
import { useToast } from "../../../components/ui/toastContext.js";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { useMarkWhatsappOrderPaid } from "../hooks/useOrders.js";
import { orderErrorMessage } from "../utils/orderUtils.js";

const payableStatuses = new Set(["unpaid", "pending", "failed"]);

export function MarkWhatsappPaidAction({ order }) {
  const { admin } = useAuth();
  const { notify } = useToast();
  const mutation = useMarkWhatsappOrderPaid(order.order_reference);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const canManagePayments = ["owner", "admin"].includes(admin?.role);
  const canMarkPaid = order.payment_method === "whatsapp" && payableStatuses.has(order.payment_status);

  if (!canManagePayments || !canMarkPaid) return null;

  const close = () => {
    if (mutation.isPending) return;
    setOpen(false);
    setError("");
  };

  const submit = async () => {
    setError("");
    try {
      await mutation.mutateAsync({ orderId: order.id });
      setOpen(false);
      notify(`${order.order_reference} was marked as paid.`);
    } catch (paymentError) {
      setError(orderErrorMessage(paymentError, "The WhatsApp payment could not be confirmed."));
    }
  };

  return <><Button size="small" onClick={() => setOpen(true)}><BadgeCheck className="size-4" aria-hidden="true" />Mark as paid</Button><Dialog open={open} onClose={close} title={`Mark ${order.order_reference} as paid?`} description="Use this only after confirming that Nuede received the WhatsApp order payment." footer={<><Button variant="ghost" disabled={mutation.isPending} onClick={close}>Keep unpaid</Button><Button busy={mutation.isPending} onClick={submit}>Confirm {formatKobo(order.total_kobo)} received</Button></>}><div className="grid gap-3 text-sm leading-6 text-muted"><p>This records the full order total as a manually confirmed WhatsApp payment and includes it in paid-sales analytics.</p><p>It does not change the fulfilment status or create a Paystack transaction.</p>{error ? <p className="text-danger" role="alert">{error}</p> : null}</div></Dialog></>;
}
