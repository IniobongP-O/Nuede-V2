import { formatKobo } from "@nuede/domain/currency";

import { EmptyState } from "../../../components/ui/FeedbackStates.jsx";
import { Panel } from "../../../components/ui/AdminPrimitives.jsx";

export function SalesRankingTable({ title, description, rows, nameKey, secondaryNameKey, rank = false }) {
  if (!rows?.length) return <EmptyState title={`No ${title.toLowerCase()} in this period`} message="This breakdown will appear after an eligible paid order contains matching purchase snapshots." />;
  return <Panel className="min-w-0 overflow-hidden">
    <div className="p-5 pb-3 sm:p-6 sm:pb-3"><h2 className="text-lg font-semibold text-brand-950">{title}</h2><p className="mt-1 text-sm text-muted">{description}</p></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[34rem] border-collapse text-left"><caption className="sr-only">{title}</caption><thead><tr className="border-y border-line bg-canvas text-xs uppercase tracking-wide text-muted">{rank ? <th className="px-5 py-3">Rank</th> : null}<th className="px-5 py-3">Name</th><th className="px-5 py-3 text-right">Quantity</th><th className="px-5 py-3 text-right">Base revenue</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[nameKey]}-${row[secondaryNameKey] || ""}-${index}`} className="border-b border-line last:border-0">{rank ? <td className="px-5 py-4 text-sm font-semibold text-brand-700">#{row.revenue_rank || index + 1}</td> : null}<td className="px-5 py-4 text-sm"><p className="font-semibold text-brand-950">{row[nameKey]}</p>{secondaryNameKey && row[secondaryNameKey] ? <p className="mt-1 text-xs text-muted">{row[secondaryNameKey]}</p> : null}</td><td className="px-5 py-4 text-right text-sm">{Number(row.quantity_sold || 0).toLocaleString("en-NG")}</td><td className="px-5 py-4 text-right text-sm font-semibold">{formatKobo(row.revenue_kobo || "0")}</td></tr>)}</tbody></table></div>
  </Panel>;
}

