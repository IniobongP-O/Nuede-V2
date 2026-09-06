import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "../../../components/ui/Button.jsx";
import { Dialog } from "../../../components/ui/Dialog.jsx";
import { TextInput } from "../../../components/ui/FormControls.jsx";
import { useToast } from "../../../components/ui/toastContext.js";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { useDeleteOrder } from "../hooks/useOrders.js";
import { orderErrorMessage } from "../utils/orderUtils.js";

export function DeleteOrderAction({ order, onDeleted, size = "small" }) {
  const { admin } = useAuth();
  const { notify } = useToast();
  const mutation = useDeleteOrder(order.order_reference);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const confirmed = confirmation.trim() === order.order_reference;

  if (admin?.role !== "owner") return null;

  const close = () => {
    if (mutation.isPending) return;
    setOpen(false);
    setConfirmation("");
    setError("");
  };

  const submit = async () => {
    if (!confirmed) return;
    setError("");
    try {
      const result = await mutation.mutateAsync({ orderId: order.id, confirmation: confirmation.trim() });
      setOpen(false);
      setConfirmation("");
      notify(`${order.order_reference} was permanently deleted.`);
      onDeleted?.(result);
    } catch (deleteError) {
      setError(orderErrorMessage(deleteError, "The order could not be deleted. Nothing was removed."));
    }
  };

  return <><Button variant="destructive" size={size} onClick={() => setOpen(true)}><Trash2 className="size-4" aria-hidden="true" />Delete order</Button><Dialog open={open} onClose={close} title={`Permanently delete ${order.order_reference}?`} description="This destructive action cannot be undone." footer={<><Button variant="ghost" disabled={mutation.isPending} onClick={close}>Keep order</Button><Button variant="destructive" busy={mutation.isPending} disabled={!confirmed} onClick={submit}>Permanently delete</Button></>}><div className="grid gap-4"><p className="text-sm leading-6 text-muted">This removes the order, its item and add-on snapshots, and its Nuede payment records. It will also disappear from sales analytics.</p>{order.payment_status === "paid" ? <p className="rounded-control border border-warning/30 bg-amber-50 p-3 text-sm leading-6 text-brand-950"><strong>Paid order:</strong> deletion does not refund or cancel the Paystack transaction.</p> : null}<TextInput label={`Type ${order.order_reference} to confirm`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" disabled={mutation.isPending} data-autofocus />{error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}</div></Dialog></>;
}
