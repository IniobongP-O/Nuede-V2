import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { formatKobo } from "@nuede/domain/currency";
import { DataTable } from "../../../components/ui/DataTable.jsx";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { DeleteOrderAction } from "./DeleteOrderAction.jsx";
import { OrderStatusBadge } from "./OrderStatusBadge.jsx";
import { formatOrderDate, orderValueLabel } from "../utils/orderUtils.js";

function DetailLink({ order, returnTo }) {
  return <Link to={`/orders/${encodeURIComponent(order.order_reference)}`} state={{ returnTo }} className="inline-flex items-center gap-1 font-semibold text-brand-700 underline-offset-4 hover:underline" aria-label={`Open order ${order.order_reference}`}>{order.order_reference}<ExternalLink className="size-3.5" aria-hidden="true" /></Link>;
}

export function OrdersList({ orders, returnTo }) {
  const { admin } = useAuth();
  const canDelete = admin?.role === "owner";
  const columns = ["Order", "Customer", "Total", "Method", "Payment", "Fulfilment", "Ordered", ...(canDelete ? ["Actions"] : [])];

  return <><div className="hidden lg:block"><DataTable caption="Nuede orders, newest first" columns={columns} rows={orders} renderRow={(order) => <tr key={order.id}><td className="px-4 py-4 text-sm"><DetailLink order={order} returnTo={returnTo} /><p className="mt-1 text-xs text-muted">{orderValueLabel(order.order_type)}</p></td><td className="px-4 py-4 text-sm"><p className="font-semibold text-brand-950">{order.customer_name}</p><p className="mt-1 text-xs text-muted">{order.customer_phone}</p></td><td className="px-4 py-4 text-sm font-semibold">{formatKobo(order.total_kobo)}</td><td className="px-4 py-4 text-sm text-muted">{orderValueLabel(order.payment_method)}</td><td className="px-4 py-4"><OrderStatusBadge type="payment" value={order.payment_status} /></td><td className="px-4 py-4"><OrderStatusBadge type="fulfilment" value={order.fulfilment_status} /></td><td className="px-4 py-4 text-sm text-muted">{formatOrderDate(order.created_at)}</td>{canDelete ? <td className="px-4 py-4"><DeleteOrderAction order={order} /></td> : null}</tr>} /></div><ul className="grid gap-3 lg:hidden" aria-label="Nuede orders, newest first">{orders.map((order) => <li key={order.id} className="rounded-card border border-line bg-surface p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><DetailLink order={order} returnTo={returnTo} /><p className="mt-1 text-xs text-muted">{formatOrderDate(order.created_at)}</p></div><p className="font-semibold text-brand-950">{formatKobo(order.total_kobo)}</p></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Customer</p><p className="mt-1 font-semibold">{order.customer_name}</p><p className="text-muted">{order.customer_phone}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Order</p><p className="mt-1">{orderValueLabel(order.order_type)} · {orderValueLabel(order.payment_method)}</p></div><div><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Payment</p><OrderStatusBadge type="payment" value={order.payment_status} /></div><div><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Fulfilment</p><OrderStatusBadge type="fulfilment" value={order.fulfilment_status} /></div></div>{canDelete ? <div className="mt-4 border-t border-line pt-4"><DeleteOrderAction order={order} /></div> : null}</li>)}</ul></>;
}
