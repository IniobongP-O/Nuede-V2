import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatKobo } from "@nuede/domain/currency";

import { EmptyState } from "../../../components/ui/FeedbackStates.jsx";
import { Panel } from "../../../components/ui/AdminPrimitives.jsx";
import { chartMoneyValue, formatAnalyticsDate, formatChartKobo } from "../utils/analyticsUtils.js";

function ChartTooltip({ active, payload, label, metric }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const exactValue = payload[0].payload.exactValue;
  return <div className="rounded-control border border-line bg-surface px-3 py-2 shadow-floating"><p className="text-xs text-muted">{formatAnalyticsDate(label)}</p><p className="mt-1 text-sm font-semibold text-brand-950">{metric === "revenue" ? formatKobo(exactValue) : `${Number(value).toLocaleString("en-NG")} paid orders`}</p></div>;
}

export function SalesTrendChart({ dailySales = [], metric = "revenue", compact = false }) {
  const isRevenue = metric === "revenue";
  const title = isRevenue ? "Revenue over time" : "Paid orders over time";
  const description = isRevenue ? "Verified paid order totals by payment date." : "Distinct verified paid orders by payment date.";
  const data = dailySales.map((row) => ({
    date: row.date,
    value: isRevenue ? chartMoneyValue(row.revenue_kobo) : Number(row.paid_orders || 0),
    exactValue: isRevenue ? row.revenue_kobo : String(row.paid_orders || 0),
  }));
  const hasValues = data.some((row) => row.value > 0);
  if (!hasValues) return <EmptyState title={`No ${isRevenue ? "revenue" : "paid orders"} in this period`} message="Change the date range or check again after a payment has been verified." />;
  const Chart = isRevenue ? AreaChart : BarChart;
  const ticks = data.length > 45 ? 14 : data.length > 14 ? 7 : 0;
  return <Panel className="min-w-0 p-5 sm:p-6" aria-labelledby={`${metric}-trend-title`}>
    <h2 id={`${metric}-trend-title`} className="text-lg font-semibold text-brand-950">{title}</h2>
    <p className="mt-1 text-sm text-muted">{description}</p>
    <div className={compact ? "mt-5 h-56" : "mt-5 h-72"}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e2e7e1" />
          <XAxis dataKey="date" tickFormatter={(value) => formatAnalyticsDate(value, { short: true, includeYear: false })} interval={ticks} minTickGap={20} tick={{ fill: "#667369", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis width={isRevenue ? 72 : 36} allowDecimals={false} tickFormatter={(value) => isRevenue ? formatChartKobo(value) : value} tick={{ fill: "#667369", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip metric={metric} />} />
          {isRevenue ? <Area type="monotone" dataKey="value" stroke="#096e21" fill="#e9f3e9" strokeWidth={2} /> : <Bar dataKey="value" fill="#096e21" radius={[5, 5, 0, 0]} />}
        </Chart>
      </ResponsiveContainer>
    </div>
    <table className="sr-only"><caption>{title} data</caption><thead><tr><th>Date</th><th>{isRevenue ? "Revenue" : "Paid orders"}</th></tr></thead><tbody>{data.map((row) => <tr key={row.date}><td>{formatAnalyticsDate(row.date)}</td><td>{isRevenue ? formatKobo(row.exactValue) : row.value}</td></tr>)}</tbody></table>
  </Panel>;
}
