import { MetricCard, Panel } from "../../../components/ui/AdminPrimitives.jsx";
import { analyticsMetricCards } from "../utils/analyticsUtils.js";

/** Renders the headline analytics metrics for the active reporting interval. */
export function AnalyticsSummaryCards({ data, range, loading = false }) {
  if (loading) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading sales summary" aria-busy="true">{[0, 1, 2, 3].map((item) => <Panel key={item} className="p-5"><div className="h-3 w-24 animate-pulse rounded bg-line" /><div className="mt-4 h-9 w-32 animate-pulse rounded bg-line" /><div className="mt-4 h-3 w-28 animate-pulse rounded bg-line" /></Panel>)}</div>;
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{analyticsMetricCards(data, range).map((metric) => <MetricCard key={metric.label} {...metric} />)}</div>;
}
