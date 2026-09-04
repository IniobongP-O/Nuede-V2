# Cycle 18 changed-file inventory

Branch: main. Working tree is not clean. No staged files, commit or tag created.

Modified tracked files: 41. Untracked files: 18. Staged files: 0.

## Modified tracked files

```text
.gitignore
README.md
apps/admin/.env.example
apps/admin/src/app/router.jsx
apps/admin/src/components/layout/AdminLayout.jsx
apps/admin/src/components/ui/Toast.jsx
apps/admin/src/features/analytics/components/AnalyticsTables.jsx
apps/admin/src/features/analytics/components/BreakdownCharts.jsx
apps/admin/src/features/analytics/components/SalesTrendChart.jsx
apps/admin/src/features/auth/context/AuthContext.jsx
apps/admin/src/pages/AnalyticsPage.jsx
apps/admin/src/pages/DashboardPage.jsx
apps/admin/src/pages/SettingsPage.jsx
apps/admin/vite.config.js
apps/storefront/.env.example
apps/storefront/src/app/router.jsx
apps/storefront/src/components/ui/Toast.jsx
apps/storefront/src/features/checkout/components/DeliveryDetailsSection.jsx
apps/storefront/src/features/content/components/ScrollCarousel.jsx
apps/storefront/vite.config.js
docs/ARCHITECTURE.md
docs/DATABASE.md
docs/DEVELOPMENT.md
docs/FEATURES.md
docs/SECURITY.md
docs/TRACEABILITY.md
package-lock.json
package.json
scripts/verify-cycle14-paystack.test.js
scripts/verify-cycle3-security.mjs
supabase/functions/.env.example
supabase/functions/_shared/order/persistence.js
supabase/functions/_shared/paystack/client.js
supabase/functions/_shared/paystack/persistence.js
supabase/functions/create-order/handler.js
supabase/functions/create-whatsapp-order/handler.js
supabase/functions/initialize-paystack/handler.js
supabase/functions/paystack-webhook/handler.js
supabase/functions/verify-paystack-payment/handler.js
supabase/migrations/README.md
supabase/tests/database/010_cycle16_sales_analytics.test.sql
```

## New untracked files

```text
apps/admin/src/features/analytics/components/OrderActivitySummary.jsx
apps/admin/src/features/orders/components/RecentOrders.jsx
apps/admin/vercel.json
apps/storefront/vercel.json
docs/CYCLE18-FILES.md
docs/CYCLE18.md
docs/DEPLOYMENT.md
docs/FEATURE-MATRIX.md
scripts/audit-hosted-public.mjs
scripts/public-environment.js
scripts/verify-cycle18-browser.mjs
scripts/verify-cycle18-secrets.mjs
scripts/verify-cycle18-security.test.js
supabase/functions/_shared/requestBody.js
supabase/migrations/20260904000200_harden_checkout_method_races.sql
supabase/migrations/20260904000300_complete_launch_analytics.sql
supabase/tests/database/012_cycle18_security.test.sql
supabase/verification/launch-readiness.sql
```

Coverage, browser screenshots, built assets and real local environment files remain ignored.
