import { RefreshCw } from "lucide-react";

import { AdminPageHeader } from "../components/layout/AdminPageHeader.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState, ErrorState } from "../components/ui/FeedbackStates.jsx";
import { AnalyticsRangeControls } from "../features/analytics/components/AnalyticsRangeControls.jsx";
import { AnalyticsSummaryCards } from "../features/analytics/components/AnalyticsSummaryCards.jsx";
import { OrderActivitySummary } from "../features/analytics/components/OrderActivitySummary.jsx";
import { SalesRankingTable } from "../features/analytics/components/AnalyticsTables.jsx";
import { DeliveryZoneChart, PaymentMixChart } from "../features/analytics/components/BreakdownCharts.jsx";
import { SalesTrendChart } from "../features/analytics/components/SalesTrendChart.jsx";
import { useSalesAnalytics } from "../features/analytics/hooks/useAnalytics.js";
import { useAnalyticsRange } from "../features/analytics/hooks/useAnalyticsRange.js";
import { analyticsErrorMessage, analyticsRangeLabel } from "../features/analytics/utils/analyticsUtils.js";

export function AnalyticsPage() {
  const rangeController = useAnalyticsRange("30d");
  const query = useSalesAnalytics(rangeController.range);
  const data = query.data;
  const hasSales = Number(data?.summary?.paid_orders || 0) > 0;

  return <>
    <AdminPageHeader eyebrow="First-party reporting" title="Sales analytics" description="Verified paid sales from permanent order, payment, and purchase-time snapshot records." />
    <div className="mt-6"><AnalyticsRangeControls controller={rangeController} /></div>
    <p className="mt-3 text-xs text-muted">All dates use Africa/Lagos business days. Active range: {analyticsRangeLabel(rangeController.range)}.</p>
    {!query.isError ? <div className="mt-6"><AnalyticsSummaryCards data={data} range={rangeController.range} loading={query.isPending} /></div> : null}

    {query.isError ? <div className="mt-6"><ErrorState title="Unable to load sales analytics" message={analyticsErrorMessage(query.error)} action={<Button variant="secondary" onClick={() => query.refetch()}><RefreshCw className="size-4" aria-hidden="true" />Retry analytics</Button>} /></div> : null}
    {!query.isPending && !query.isError && !hasSales ? <div className="mt-6"><EmptyState title="No verified paid sales in this period" message="The zero values are real. Pending, failed, unpaid, refunded, and unverified orders do not contribute." /></div> : null}

    {query.isSuccess ? <OrderActivitySummary data={data} /> : null}
    {!query.isPending && !query.isError && hasSales ? <>
      <div className="mt-6 grid gap-6 xl:grid-cols-2"><SalesTrendChart dailySales={data.daily_sales} metric="revenue" /><SalesTrendChart dailySales={data.daily_sales} metric="orders" /></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2"><PaymentMixChart rows={data.payment_method_sales} /><DeliveryZoneChart rows={data.delivery_zone_sales} /></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2"><SalesRankingTable title="Top products" description="Ranked by base-product revenue; add-ons and delivery fees are reported separately." rows={data.product_sales} nameKey="product_name" rank /><SalesRankingTable title="Variant sales" description="Purchased variant snapshots grouped beneath their historical product labels." rows={data.variant_sales} nameKey="variant_name" secondaryNameKey="product_name" /></div>
      <div className="mt-6"><SalesRankingTable title="Add-on sales" description="Purchased add-on prices multiplied by the parent item quantity." rows={data.addon_sales} nameKey="addon_name" /></div>
    </> : null}
  </>;
}
