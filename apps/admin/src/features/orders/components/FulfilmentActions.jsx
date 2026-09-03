import { useState } from "react";

import { canCancelFulfilment, nextFulfilmentAction, humanizeOrderValue } from "@nuede/domain/orders";
import { Panel } from "../../../components/ui/AdminPrimitives.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Dialog } from "../../../components/ui/Dialog.jsx";
import { OrderStatusBadge } from "./OrderStatusBadge.jsx";

export function FulfilmentActions({ order, mutation, onUpdate }) {
  const [confirmCancellation, setConfirmCancellation] = useState(false);
  const next = nextFulfilmentAction(order.fulfilment_status);
  const cancellable = canCancelFulfilment(order.fulfilment_status);
  const submitCancellation = async () => {
    const succeeded = await onUpdate("cancelled");
    if (succeeded) setConfirmCancellation(false);
  };
  return <><Panel className="p-5"><p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">Fulfilment workflow</p><div className="mt-3 flex flex-wrap items-center justify-between gap-4"><div><p className="mb-2 text-sm font-semibold">Current state</p><OrderStatusBadge type="fulfilment" value={order.fulfilment_status} /></div><div className="flex flex-wrap gap-2">{cancellable ? <Button variant="destructive" disabled={mutation.isPending} onClick={() => setConfirmCancellation(true)}>Cancel order</Button> : null}{next ? <Button busy={mutation.isPending} onClick={() => onUpdate(next)}>Mark {humanizeOrderValue(next)}</Button> : null}</div></div>{!next && !cancellable ? <p className="mt-4 text-sm text-muted">This order is in a terminal fulfilment state. No further actions are available.</p> : null}<p className="mt-4 text-xs leading-5 text-muted">Allowed progression: Pending → Confirmed → Preparing → Ready → Out for delivery → Delivered.</p></Panel><Dialog open={confirmCancellation} onClose={() => { if (!mutation.isPending) setConfirmCancellation(false); }} title={`Cancel ${order.order_reference}?`} description="Cancellation stops the fulfilment workflow and cannot be reversed here." footer={<><Button variant="ghost" disabled={mutation.isPending} onClick={() => setConfirmCancellation(false)}>Keep order</Button><Button variant="destructive" busy={mutation.isPending} onClick={submitCancellation}>Confirm cancellation</Button></>}><p className="text-sm leading-6 text-muted">The order will be marked Cancelled. Its historical prices, items, payment status, and Paystack records will remain unchanged. A paid order is not automatically refunded.</p></Dialog></>;
}
