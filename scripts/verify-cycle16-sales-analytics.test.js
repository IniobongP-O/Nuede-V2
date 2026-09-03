import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  analyticsMetricCards,
  analyticsRangeLabel,
  businessDate,
  rangeForPreset,
  shiftDate,
  validateCustomRange,
} from "../apps/admin/src/features/analytics/utils/analyticsUtils.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Cycle 16 date presets use inclusive Africa/Lagos business dates", () => {
  const now = new Date("2026-09-03T00:15:00+01:00");
  assert.equal(businessDate(now), "2026-09-03");
  assert.deepEqual(rangeForPreset("today", "2026-09-03"), { from: "2026-09-03", to: "2026-09-03", preset: "today" });
  assert.deepEqual(rangeForPreset("7d", "2026-09-03"), { from: "2026-08-28", to: "2026-09-03", preset: "7d" });
  assert.deepEqual(rangeForPreset("30d", "2026-09-03"), { from: "2026-08-05", to: "2026-09-03", preset: "30d" });
  assert.deepEqual(rangeForPreset("90d", "2026-09-03"), { from: "2026-06-06", to: "2026-09-03", preset: "90d" });
  assert.equal(shiftDate("2026-03-01", -1), "2026-02-28");
});

test("Cycle 16 custom ranges accept one day and reject missing or reversed dates", () => {
  assert.equal(validateCustomRange("2026-09-03", "2026-09-03"), "");
  assert.match(validateCustomRange("", "2026-09-03"), /both a start and end/i);
  assert.match(validateCustomRange("2026-09-04", "2026-09-03"), /on or before/i);
});

test("Cycle 16 KPI presentation formats exact kobo and safe zero AOV", () => {
  const cards = analyticsMetricCards({ summary: { revenue_kobo: "3000000", paid_orders: 2, average_order_value_kobo: "1500000", items_sold: 5 } }, { from: "2026-09-02", to: "2026-09-02" });
  assert.deepEqual(cards.map((card) => card.value), ["₦30,000", "2", "₦15,000", "5"]);
  const zero = analyticsMetricCards({ summary: { revenue_kobo: "0", paid_orders: 0, average_order_value_kobo: "0", items_sold: 0 } }, { from: "2026-09-02", to: "2026-09-02" });
  assert.deepEqual(zero.map((card) => card.value), ["₦0", "0", "₦0", "0"]);
  assert.match(analyticsRangeLabel({ from: "2026-09-02", to: "2026-09-02" }), /2 September 2026/);
});

test("Cycle 16 SQL centralizes one eligible order and trusted Paystack evidence", async () => {
  const migration = await read("supabase/migrations/20260903000500_add_first_party_sales_analytics.sql");
  const eligible = migration.slice(migration.indexOf("create or replace view private.analytics_eligible_sales"), migration.indexOf("create or replace view private.daily_sales"));
  assert.match(eligible, /order_row\.payment_status = 'paid'/);
  assert.match(eligible, /payment\.status = 'paid'/);
  assert.match(eligible, /payment\.verification_status = 'verified'/);
  assert.match(eligible, /payment\.amount_kobo = order_row\.total_kobo/);
  assert.match(eligible, /payment\.provider_amount_kobo = order_row\.total_kobo/);
  assert.match(eligible, /upper\(payment\.provider_currency\) = 'NGN'/);
  assert.match(eligible, /select min\(payment\.verified_at\)/);
  assert.doesNotMatch(eligible, /fulfilment_status/);
  assert.doesNotMatch(eligible, /order_row\.created_at/);
});

test("Cycle 16 aggregate views use immutable snapshots and item quantities", async () => {
  const migration = await read("supabase/migrations/20260903000500_add_first_party_sales_analytics.sql");
  for (const view of ["daily_sales", "product_sales", "variant_sales", "addon_sales", "delivery_zone_sales", "payment_method_sales"]) assert.match(migration, new RegExp(`view private\\.${view}`));
  assert.match(migration, /item\.unit_base_price_kobo \* item\.quantity/);
  assert.match(migration, /addon\.unit_price_kobo \* item\.quantity/);
  assert.match(migration, /item\.product_name/);
  assert.match(migration, /item\.variant_name/);
  assert.match(migration, /sale\.delivery_zone_name/);
  assert.doesNotMatch(migration, /join public\.products as/);
  assert.doesNotMatch(migration, /join public\.product_variants as/);
  assert.doesNotMatch(migration, /join public\.product_addons as/);
});

test("Cycle 16 RPC is admin-only, range-consistent, and returns exact money text", async () => {
  const migration = await read("supabase/migrations/20260903000500_add_first_party_sales_analytics.sql");
  const rpc = migration.slice(migration.indexOf("create or replace function public.get_admin_sales_analytics"));
  assert.match(rpc, /if not \(select private\.is_active_admin\(\)\)/);
  assert.match(rpc, /sale_date between p_from and p_to/g);
  assert.match(rpc, /INVALID_ANALYTICS_DATE_RANGE/);
  assert.match(rpc, /Africa\/Lagos/);
  assert.match(rpc, /revenue_kobo'\s*,\s*summary\.revenue_kobo::text/);
  assert.match(rpc, /when summary\.paid_orders = 0 then '0'/);
  assert.match(rpc, /revoke all on function public\.get_admin_sales_analytics[\s\S]*from public, anon, authenticated/);
  assert.match(rpc, /grant execute on function public\.get_admin_sales_analytics[\s\S]*to authenticated/);
});

test("Cycle 16 browser requests one aggregate RPC and never downloads raw orders", async () => {
  const api = await read("apps/admin/src/features/analytics/api/analyticsApi.js");
  const hook = await read("apps/admin/src/features/analytics/hooks/useAnalytics.js");
  assert.match(api, /\.rpc\("get_admin_sales_analytics"/);
  assert.doesNotMatch(api, /\.from\(["']orders/);
  assert.doesNotMatch(api, /\.from\(["']payments/);
  assert.match(hook, /staleTime: 5 \* 60 \* 1000/);
  assert.match(hook, /range\.from, range\.to/);
});

test("Cycle 16 admin surfaces replace fixtures with real states, filters, charts, and tables", async () => {
  const page = await read("apps/admin/src/pages/AnalyticsPage.jsx");
  const dashboard = await read("apps/admin/src/pages/DashboardPage.jsx");
  const charts = await read("apps/admin/src/features/analytics/components/SalesTrendChart.jsx");
  const breakdowns = await read("apps/admin/src/features/analytics/components/BreakdownCharts.jsx");
  const controls = await read("apps/admin/src/features/analytics/components/AnalyticsRangeControls.jsx");
  const summary = await read("apps/admin/src/features/analytics/components/AnalyticsSummaryCards.jsx");
  const source = `${page}\n${dashboard}\n${charts}\n${breakdowns}\n${controls}\n${summary}`;
  assert.doesNotMatch(source, /adminFixtures|demoMetrics|demoChartPoints|static reporting|placeholder/i);
  for (const required of ["Revenue over time", "Paid orders over time", "Payment method mix", "Delivery-zone performance", "Top products", "Variant sales", "Add-on sales"]) assert.match(source, new RegExp(required, "i"));
  assert.match(source, /ResponsiveContainer/);
  assert.match(source, /Loading sales summary/);
  assert.match(source, /Unable to load sales analytics/);
  assert.match(source, /No verified paid sales/);
  assert.match(controls, /type="date"/);
  assert.match(controls, /role="alert"/);
});

test("Cycle 16 browser analytics contains no privileged secret or write operation", async () => {
  const files = [
    "apps/admin/src/features/analytics/api/analyticsApi.js",
    "apps/admin/src/features/analytics/hooks/useAnalytics.js",
    "apps/admin/src/pages/AnalyticsPage.jsx",
    "apps/admin/src/pages/DashboardPage.jsx",
  ];
  const source = (await Promise.all(files.map(read))).join("\n");
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|PAYSTACK_SECRET_KEY|webhook.secret/i);
  assert.doesNotMatch(source, /\.insert\(|\.update\(|\.delete\(/);
});
