import { ArrowUpRight, RefreshCw } from "lucide-react";

import { adminPaths } from "../app/routePaths.js";
import { AdminPageHeader } from "../components/layout/AdminPageHeader.jsx";
import { Button } from "../components/ui/Button.jsx";
import { ErrorState } from "../components/ui/FeedbackStates.jsx";
import { Panel } from "../components/ui/AdminPrimitives.jsx";
import { AnalyticsSummaryCards } from "../features/analytics/components/AnalyticsSummaryCards.jsx";
import { SalesTrendChart } from "../features/analytics/components/SalesTrendChart.jsx";
import { useSalesAnalytics } from "../features/analytics/hooks/useAnalytics.js";
import { rangeForPreset } from "../features/analytics/utils/analyticsUtils.js";

const dashboardRange = rangeForPreset("30d");

export function DashboardPage() {
  const query = useSalesAnalytics(dashboardRange);
  return <>
    <AdminPageHeader eyebrow="Operations overview" title="Dashboard" description="A current 30-day view of verified revenue and paid orders." actions={<Button to={adminPaths.analytics} variant="secondary">Explore analytics <ArrowUpRight className="size-4" aria-hidden="true" /></Button>} />
    <div className="mt-6"><AnalyticsSummaryCards data={query.data} range={dashboardRange} loading={query.isPending} /></div>
    {query.isError ? <div className="mt-6"><ErrorState title="Dashboard sales metrics are unavailable" message="The analytics query failed, so no zero values are being substituted." action={<Button variant="secondary" onClick={() => query.refetch()}><RefreshCw className="size-4" aria-hidden="true" />Retry metrics</Button>} /></div> : null}
    {!query.isPending && !query.isError ? <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"><SalesTrendChart dailySales={query.data.daily_sales} metric="revenue" compact /><Panel className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Quick actions</p><h2 className="mt-2 text-xl font-semibold text-brand-950">Run the store</h2><div className="mt-5 grid divide-y divide-line">{[{ label: "Review orders", path: adminPaths.orders }, { label: "Full analytics", path: adminPaths.analytics }, { label: "Delivery pricing", path: adminPaths.delivery }, { label: "Checkout settings", path: adminPaths.settings }].map((item) => <Button key={item.path} to={item.path} variant="ghost" className="justify-between rounded-none px-0">{item.label}<ArrowUpRight className="size-4" aria-hidden="true" /></Button>)}</div></Panel></div> : null}
  </>;
}
