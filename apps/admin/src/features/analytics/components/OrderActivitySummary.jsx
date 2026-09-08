import { formatKobo } from "@nuede/domain/currency";
import { MetricCard, Panel } from "../../../components/ui/AdminPrimitives.jsx";
import { humanizeOrderValue } from "@nuede/domain/orders";

/** Summarizes current order volume by fulfilment and payment status. */
export function OrderActivitySummary({ data }) {
  if (!data?.order_activity || !Array.isArray(data.order_type_sales)) return <p className="mt-6 text-sm text-muted" role="status">Order activity breakdown is unavailable.</p>;
  const activity = data.order_activity;
  return <section className="mt-6 min-w-0" aria-labelledby="order-activity-heading">
    <h2 id="order-activity-heading" className="text-xl font-semibold text-brand-950">Order activity</h2>
    <p className="mt-2 text-sm text-muted">Orders created in the selected period. These counts include unpaid orders and do not add to verified revenue.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-3">{[["Orders placed", activity.total_orders], ["Cancelled orders", activity.cancelled_orders], ["Failed payments", activity.failed_payments]].map(([label, value]) => <MetricCard key={label} label={label} value={Number(value).toLocaleString("en-NG")} />)}</div>
    <Panel className="mt-4 min-w-0 overflow-hidden p-5"><h3 className="text-lg font-semibold text-brand-950">Direct orders and meal plans</h3><p className="mt-1 text-sm text-muted">Verified sales by payment date in the selected period.</p>
      {data.order_type_sales.length ? <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Verified sales by order type"><table className="w-full min-w-80 text-left text-sm"><caption className="sr-only">Verified sales by order type</caption><thead><tr><th className="py-2">Order type</th><th className="py-2 text-right">Paid orders</th><th className="py-2 text-right">Revenue</th></tr></thead><tbody>{data.order_type_sales.map((row) => <tr key={row.order_type}><td className="py-3">{humanizeOrderValue(row.order_type)}</td><td className="py-3 text-right">{row.paid_orders}</td><td className="py-3 text-right">{formatKobo(row.revenue_kobo)}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-sm text-muted">No verified sales in this period.</p>}
    </Panel>
  </section>;
}
