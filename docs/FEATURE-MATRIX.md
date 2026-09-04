# Complete numbered feature ledger

Source: `nuede_v2_complete_feature_specification.pdf`, 212 numbered requirements. Cycles 0–17 remain the accepted implementation foundation. This ledger maps every numbered requirement to current code and specific evidence boundaries; it does not convert historical source assertions into live acceptance. See [Cycle 18 results](CYCLE18.md) and [launch runbook](DEPLOYMENT.md).

“Mapped” identifies implementation responsibility, not a claim that every external behavior has passed. Hosted migration/function gaps and final launch proof remain blockers. Requirements 96, 99, 105, 141, 142, 167 and 194 received Cycle 18 completion work. Future-readiness requirements 208–212 do not authorize new launch features.

| Spec | Required | Implemented / mapped location | Tested / remaining evidence |
|---|---|---|---|
| 1 | Responsive Website Navigation | Storefront layout / features/content | Cycle 17 content tests and browser suite |
| 2 | Hero / Landing Section | Storefront layout / features/content | Cycle 17 content tests and browser suite |
| 3 | About Nuede Section | Storefront layout / features/content | Cycle 17 content tests and browser suite |
| 4 | Featured Meals | Storefront layout / features/content | Cycle 17 content tests and browser suite |
| 5 | Supabase-Powered Live Menu | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 6 | Product Categories | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 7 | Menu Search | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 8 | Menu Filtering | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 9 | Standard Meal Cards | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 10 | Product Availability States | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 11 | Grouped Meals | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 12 | Variant Selection | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 13 | Stable Variant IDs | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 14 | Default Variant Support | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 15 | Variant-Specific Availability | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 16 | Meal Detail Modal | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 17 | Grouped Meal Detail | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 18 | Accessible Modal Controls | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 19 | Meal Add-ons | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 20 | Add-on Information | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 21 | Multiple Add-ons | Storefront features/menu + product-detail; catalog schema | Cycles 5–7 domain/source tests; Cycle 18 mocked grouped checkout |
| 22 | Nutrition Tracking | packages/domain/nutrition; order/nutrition | Cycle 8 nutrition and Cycle 12 order tests |
| 23 | Dynamic Nutrition Calculation | packages/domain/nutrition; order/nutrition | Cycle 8 nutrition and Cycle 12 order tests |
| 24 | Incomplete Nutrition Detection | packages/domain/nutrition; order/nutrition | Cycle 8 nutrition and Cycle 12 order tests |
| 25 | Favorites | Storefront features/saved-meals | Cycle 8 saved-meal persistence tests |
| 26 | Local Favorite Persistence | Storefront features/saved-meals | Cycle 8 saved-meal persistence tests |
| 27 | Multi-Day Meal Planner | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 28 | Daily Meal Slots | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 29 | Automatic Plan Dates | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 30 | Desktop Planner | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 31 | Mobile Planner | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 32 | Planner Meal Browser | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 33 | Planner Filters | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 34 | Planner Availability Checks | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 35 | Meal Slot Selection | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 36 | Quick Add | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 37 | Drag and Drop | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 38 | Grouped Meals in Planner | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 39 | Clear Meal Plan | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 40 | Meal Plan Nutrition Summary | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 41 | Meal Plan Nutrition Warnings | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 42 | Browser-Saved Meal Plans | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 43 | Fresh-Site Data Strategy | Storefront features/planner; validation/planner | Cycle 10 planner tests; Cycle 18 mocked planner journeys |
| 44 | Shopping Basket | Storefront features/cart; domain/cart | Cycle 9 cart tests; Cycle 18 mocked persisted basket journeys |
| 45 | Cart Quantities | Storefront features/cart; domain/cart | Cycle 9 cart tests; Cycle 18 mocked persisted basket journeys |
| 46 | Cart Item Details | Storefront features/cart; domain/cart | Cycle 9 cart tests; Cycle 18 mocked persisted basket journeys |
| 47 | Cart Management | Storefront features/cart; domain/cart | Cycle 9 cart tests; Cycle 18 mocked persisted basket journeys |
| 48 | Cart Price Summary | Storefront features/cart; domain/cart | Cycle 9 cart tests; Cycle 18 mocked persisted basket journeys |
| 49 | Cart Nutrition Summary | Storefront features/cart; domain/cart | Cycle 9 cart tests; Cycle 18 mocked persisted basket journeys |
| 50 | Customer Delivery Details | Storefront features/checkout; admin checkout-settings | Cycle 11 tests; Cycle 18 mocked checkout |
| 51 | Delivery Zones | Storefront features/checkout; admin checkout-settings | Cycle 11 tests; Cycle 18 mocked checkout |
| 52 | Dynamic Delivery Pricing | Storefront features/checkout; admin checkout-settings | Cycle 11 tests; Cycle 18 mocked checkout |
| 53 | Admin-Controlled Delivery Pricing | Storefront features/checkout; admin checkout-settings | Cycle 11 tests; Cycle 18 mocked checkout |
| 54 | Dedicated Checkout Page | Storefront features/checkout; admin checkout-settings | Cycle 11 tests; Cycle 18 mocked checkout |
| 55 | Order Type Detection | Storefront features/checkout; admin checkout-settings | Cycle 11 tests; Cycle 18 mocked checkout |
| 56 | Checkout Order Summary | Storefront features/checkout; admin checkout-settings | Cycle 11 tests; Cycle 18 mocked checkout |
| 57 | Configurable Checkout Payment Options | Storefront features/checkout; admin checkout-settings | Cycle 11 tests; Cycle 18 mocked checkout |
| 58 | Trusted Server-Side Order Validation | supabase/functions/_shared/order; order persistence migrations | Cycle 12 engine tests; live pgTAP NOT RUN |
| 59 | Product Revalidation | supabase/functions/_shared/order; order persistence migrations | Cycle 12 engine tests; live pgTAP NOT RUN |
| 60 | Variant Revalidation | supabase/functions/_shared/order; order persistence migrations | Cycle 12 engine tests; live pgTAP NOT RUN |
| 61 | Add-on Revalidation | supabase/functions/_shared/order; order persistence migrations | Cycle 12 engine tests; live pgTAP NOT RUN |
| 62 | Payment Method Revalidation | supabase/functions/_shared/order; order persistence migrations | Cycle 12 engine tests; live pgTAP NOT RUN |
| 63 | Server-Side Price Calculation | supabase/functions/_shared/order; order persistence migrations | Cycle 12 engine tests; live pgTAP NOT RUN |
| 64 | Integer Currency Storage | supabase/functions/_shared/order; order persistence migrations | Cycle 12 engine tests; live pgTAP NOT RUN |
| 65 | Permanent Orders | supabase/functions/_shared/order; order persistence migrations | Cycle 12 engine tests; live pgTAP NOT RUN |
| 66 | Unique Order Numbers | supabase/functions/_shared/order; order persistence migrations | Cycle 12 engine tests; live pgTAP NOT RUN |
| 67 | Order Snapshot Data | supabase/functions/_shared/order; order persistence migrations | Cycle 12 engine tests; live pgTAP NOT RUN |
| 68 | Order Status | supabase/functions/_shared/order; order persistence migrations | Cycle 12 engine tests; live pgTAP NOT RUN |
| 69 | Payment Status | supabase/functions/_shared/order; order persistence migrations | Cycle 12 engine tests; live pgTAP NOT RUN |
| 70 | Payment Method | supabase/functions/_shared/order; order persistence migrations | Cycle 12 engine tests; live pgTAP NOT RUN |
| 71 | Continue Using WhatsApp | create-whatsapp-order; _shared/whatsapp; checkout handoff | Cycle 13 tests; Cycle 18 mocked WhatsApp journeys; hosted NOT RUN |
| 72 | Manual WhatsApp Checkout | create-whatsapp-order; _shared/whatsapp; checkout handoff | Cycle 13 tests; Cycle 18 mocked WhatsApp journeys; hosted NOT RUN |
| 73 | Generated WhatsApp Order Message | create-whatsapp-order; _shared/whatsapp; checkout handoff | Cycle 13 tests; Cycle 18 mocked WhatsApp journeys; hosted NOT RUN |
| 74 | Paid Order WhatsApp Message | create-whatsapp-order; _shared/whatsapp; checkout handoff | Cycle 13 tests; Cycle 18 mocked WhatsApp journeys; hosted NOT RUN |
| 75 | Pay Online Option | Paystack Edge Functions; payment result page; payment migration | Cycle 14/18 tests; mocked Paystack journeys; real provider NOT RUN |
| 76 | Hosted Paystack Checkout | Paystack Edge Functions; payment result page; payment migration | Cycle 14/18 tests; mocked Paystack journeys; real provider NOT RUN |
| 77 | Backend Transaction Initialization | Paystack Edge Functions; payment result page; payment migration | Cycle 14/18 tests; mocked Paystack journeys; real provider NOT RUN |
| 78 | Secure Paystack Secret Storage | Paystack Edge Functions; payment result page; payment migration | Cycle 14/18 tests; mocked Paystack journeys; real provider NOT RUN |
| 79 | Payment Reference | Paystack Edge Functions; payment result page; payment migration | Cycle 14/18 tests; mocked Paystack journeys; real provider NOT RUN |
| 80 | Paystack Webhook | Paystack Edge Functions; payment result page; payment migration | Cycle 14/18 tests; mocked Paystack journeys; real provider NOT RUN |
| 81 | Webhook Signature Verification | Paystack Edge Functions; payment result page; payment migration | Cycle 14/18 tests; mocked Paystack journeys; real provider NOT RUN |
| 82 | Server-Side Payment Verification | Paystack Edge Functions; payment result page; payment migration | Cycle 14/18 tests; mocked Paystack journeys; real provider NOT RUN |
| 83 | Duplicate Webhook Protection | Paystack Edge Functions; payment result page; payment migration | Cycle 14/18 tests; mocked Paystack journeys; real provider NOT RUN |
| 84 | Payment Success Page | Paystack Edge Functions; payment result page; payment migration | Cycle 14/18 tests; mocked Paystack journeys; real provider NOT RUN |
| 85 | Continue to WhatsApp After Payment | Paystack Edge Functions; payment result page; payment migration | Cycle 14/18 tests; mocked Paystack journeys; real provider NOT RUN |
| 86 | Completely Separate Admin Frontend | Independent apps and app-root vercel.json | Independent build PASS; actual V2 deployment NOT RUN |
| 87 | Separate Admin Deployment | Independent apps and app-root vercel.json | Independent build PASS; actual V2 deployment NOT RUN |
| 88 | Supabase Admin Login | Admin features/auth; active-admin RLS | Cycle 3 tests; Cycle 18 mocked personas; live authenticated tests NOT RUN |
| 89 | No Public Admin Registration | Admin features/auth; active-admin RLS | Cycle 3 tests; Cycle 18 mocked personas; live authenticated tests NOT RUN |
| 90 | Active Admin Accounts | Admin features/auth; active-admin RLS | Cycle 3 tests; Cycle 18 mocked personas; live authenticated tests NOT RUN |
| 91 | Admin Roles | Admin features/auth; active-admin RLS | Cycle 3 tests; Cycle 18 mocked personas; live authenticated tests NOT RUN |
| 92 | Admin Logout | Admin features/auth; active-admin RLS | Cycle 3 tests; Cycle 18 mocked personas; live authenticated tests NOT RUN |
| 93 | Admin Session Handling | Admin features/auth; active-admin RLS | Cycle 3 tests; Cycle 18 mocked personas; live authenticated tests NOT RUN |
| 94 | Dashboard Home | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 95 | Sales Summary Cards | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 96 | Recent Orders | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 97 | First-Party Sales Analytics | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 98 | Revenue Analytics | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 99 | Order Analytics | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 100 | Product Sales Analytics | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 101 | Variant Analytics | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 102 | Add-on Analytics | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 103 | Delivery Zone Analytics | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 104 | Payment Method Analytics | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 105 | Meal Plan Analytics | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 106 | Date Filters | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 107 | Analytics Charts | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 108 | PostgreSQL Analytics Views | Admin Dashboard/Analytics; RecentOrders; OrderActivitySummary; analytics migrations | Cycle 16/18 tests and mocked browser; SQL reconciliation NOT RUN |
| 109 | Orders Page | Admin features/orders; order-management migration | Cycle 15 tests; five mocked fulfilment journeys; live RPC NOT RUN |
| 110 | Order Search | Admin features/orders; order-management migration | Cycle 15 tests; five mocked fulfilment journeys; live RPC NOT RUN |
| 111 | Order Filtering | Admin features/orders; order-management migration | Cycle 15 tests; five mocked fulfilment journeys; live RPC NOT RUN |
| 112 | Order Details | Admin features/orders; order-management migration | Cycle 15 tests; five mocked fulfilment journeys; live RPC NOT RUN |
| 113 | Order Status Management | Admin features/orders; order-management migration | Cycle 15 tests; five mocked fulfilment journeys; live RPC NOT RUN |
| 114 | Menu Management Dashboard | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 115 | Add Standard Product | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 116 | Edit Product | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 117 | Product Search | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 118 | Product Category Filter | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 119 | Product Status Filter | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 120 | Quick Availability Management | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 121 | Product Deletion | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 122 | Grouped Product Administration | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 123 | Group Parent Settings | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 124 | Variant Administration | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 125 | Variant Fields | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 126 | Grouped Product Validation | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 127 | Add-on Management | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 128 | Add-on Fields | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 129 | Shared Group Add-ons | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 130 | Supabase Storage | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 131 | Image Upload | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 132 | Image Preview | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 133 | Image Validation | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 134 | Image Optimization | Admin features/catalog; Storage/catalog migrations | Cycle 4/5 tests; browser route coverage; actual CRUD/upload tests NOT RUN |
| 135 | Delivery Pricing Admin Page | Admin checkout-settings; Cycle 18 settings authorization/audit triggers | Cycle 11/18 tests; mocked editor restriction; live policy/trigger tests NOT RUN |
| 136 | Edit Delivery Fees | Admin checkout-settings; Cycle 18 settings authorization/audit triggers | Cycle 11/18 tests; mocked editor restriction; live policy/trigger tests NOT RUN |
| 137 | Enable/Disable Delivery Areas | Admin checkout-settings; Cycle 18 settings authorization/audit triggers | Cycle 11/18 tests; mocked editor restriction; live policy/trigger tests NOT RUN |
| 138 | Payment Options Admin Page | Admin checkout-settings; Cycle 18 settings authorization/audit triggers | Cycle 11/18 tests; mocked editor restriction; live policy/trigger tests NOT RUN |
| 139 | Enable/Disable Pay with Paystack | Admin checkout-settings; Cycle 18 settings authorization/audit triggers | Cycle 11/18 tests; mocked editor restriction; live policy/trigger tests NOT RUN |
| 140 | Enable/Disable Pay with WhatsApp | Admin checkout-settings; Cycle 18 settings authorization/audit triggers | Cycle 11/18 tests; mocked editor restriction; live policy/trigger tests NOT RUN |
| 141 | Payment Option Safety Rules | Admin checkout-settings; Cycle 18 settings authorization/audit triggers | Cycle 11/18 tests; mocked editor restriction; live policy/trigger tests NOT RUN |
| 142 | Payment Settings Permissions | Admin checkout-settings; Cycle 18 settings authorization/audit triggers | Cycle 11/18 tests; mocked editor restriction; live policy/trigger tests NOT RUN |
| 143 | Public Testimonials | Both apps features/content; Cycle 17 migration; storefront public contact config | Cycle 17 content/browser tests; configured hosted backend lacks public projection |
| 144 | Testimonial Administration | Both apps features/content; Cycle 17 migration; storefront public contact config | Cycle 17 content/browser tests; configured hosted backend lacks public projection |
| 145 | Realtime Testimonial Updates | Both apps features/content; Cycle 17 migration; storefront public contact config | Cycle 17 content/browser tests; configured hosted backend lacks public projection |
| 146 | Feedback Form | Both apps features/content; Cycle 17 migration; storefront public contact config | Cycle 17 content/browser tests; configured hosted backend lacks public projection |
| 147 | Feedback Subjects | Both apps features/content; Cycle 17 migration; storefront public contact config | Cycle 17 content/browser tests; configured hosted backend lacks public projection |
| 148 | Feedback Privacy | Both apps features/content; Cycle 17 migration; storefront public contact config | Cycle 17 content/browser tests; configured hosted backend lacks public projection |
| 149 | Admin Feedback Management | Both apps features/content; Cycle 17 migration; storefront public contact config | Cycle 17 content/browser tests; configured hosted backend lacks public projection |
| 150 | Convert Feedback Into Testimonial | Both apps features/content; Cycle 17 migration; storefront public contact config | Cycle 17 content/browser tests; configured hosted backend lacks public projection |
| 151 | FAQ Section | Both apps features/content; Cycle 17 migration; storefront public contact config | Cycle 17 content/browser tests; configured hosted backend lacks public projection |
| 152 | Nutrition Disclaimer | Both apps features/content; Cycle 17 migration; storefront public contact config | Cycle 17 content/browser tests; configured hosted backend lacks public projection |
| 153 | Contact Information | Both apps features/content; Cycle 17 migration; storefront public contact config | Cycle 17 content/browser tests; configured hosted backend lacks public projection |
| 154 | Supabase Realtime | Supabase migrations/functions; environment guard; validation packages | Domain/source tests and hosted anonymous probes; migration replay/active personas NOT RUN |
| 155 | PostgreSQL Backend | Supabase migrations/functions; environment guard; validation packages | Domain/source tests and hosted anonymous probes; migration replay/active personas NOT RUN |
| 156 | Core Database Entities | Supabase migrations/functions; environment guard; validation packages | Domain/source tests and hosted anonymous probes; migration replay/active personas NOT RUN |
| 157 | Checkout Settings Data | Supabase migrations/functions; environment guard; validation packages | Domain/source tests and hosted anonymous probes; migration replay/active personas NOT RUN |
| 158 | Database Migrations | Supabase migrations/functions; environment guard; validation packages | Domain/source tests and hosted anonymous probes; migration replay/active personas NOT RUN |
| 159 | Row Level Security | Supabase migrations/functions; environment guard; validation packages | Domain/source tests and hosted anonymous probes; migration replay/active personas NOT RUN |
| 160 | Public Read Policies | Supabase migrations/functions; environment guard; validation packages | Domain/source tests and hosted anonymous probes; migration replay/active personas NOT RUN |
| 161 | Admin Write Policies | Supabase migrations/functions; environment guard; validation packages | Domain/source tests and hosted anonymous probes; migration replay/active personas NOT RUN |
| 162 | Protected Payment Data | Supabase migrations/functions; environment guard; validation packages | Domain/source tests and hosted anonymous probes; migration replay/active personas NOT RUN |
| 163 | Protected Order Creation | Supabase migrations/functions; environment guard; validation packages | Domain/source tests and hosted anonymous probes; migration replay/active personas NOT RUN |
| 164 | Protected Checkout Settings | Supabase migrations/functions; environment guard; validation packages | Domain/source tests and hosted anonymous probes; migration replay/active personas NOT RUN |
| 165 | Server Secrets | Supabase migrations/functions; environment guard; validation packages | Domain/source tests and hosted anonymous probes; migration replay/active personas NOT RUN |
| 166 | Runtime Validation | Supabase migrations/functions; environment guard; validation packages | Domain/source tests and hosted anonymous probes; migration replay/active personas NOT RUN |
| 167 | Administrative Audit Log | Supabase migrations/functions; environment guard; validation packages | Domain/source tests and hosted anonymous probes; migration replay/active personas NOT RUN |
| 168 | Loading States | Both apps loading/error/dialog/layout components; hardened summary/notification/table states | Node tests; Cycle 17/18 browser checks; details in CYCLE18.md |
| 169 | Error States | Both apps loading/error/dialog/layout components; hardened summary/notification/table states | Node tests; Cycle 17/18 browser checks; details in CYCLE18.md |
| 170 | Missing Product Data Handling | Both apps loading/error/dialog/layout components; hardened summary/notification/table states | Node tests; Cycle 17/18 browser checks; details in CYCLE18.md |
| 171 | Checkout Price Change Detection | Both apps loading/error/dialog/layout components; hardened summary/notification/table states | Node tests; Cycle 17/18 browser checks; details in CYCLE18.md |
| 172 | Availability Change Detection | Both apps loading/error/dialog/layout components; hardened summary/notification/table states | Node tests; Cycle 17/18 browser checks; details in CYCLE18.md |
| 173 | Disabled Payment Method Handling | Both apps loading/error/dialog/layout components; hardened summary/notification/table states | Node tests; Cycle 17/18 browser checks; details in CYCLE18.md |
| 174 | Payment Failure Handling | Both apps loading/error/dialog/layout components; hardened summary/notification/table states | Node tests; Cycle 17/18 browser checks; details in CYCLE18.md |
| 175 | Accessible UI | Both apps loading/error/dialog/layout components; hardened summary/notification/table states | Node tests; Cycle 17/18 browser checks; details in CYCLE18.md |
| 176 | Mobile-First Responsive Design | Both apps loading/error/dialog/layout components; hardened summary/notification/table states | Node tests; Cycle 17/18 browser checks; details in CYCLE18.md |
| 177 | Responsive Admin Console | Both apps loading/error/dialog/layout components; hardened summary/notification/table states | Node tests; Cycle 17/18 browser checks; details in CYCLE18.md |
| 178 | Separate Storefront and Admin Applications | npm workspaces; independent React/Vite JS apps; shared packages | Foundation tests, lint and both builds |
| 179 | Shared JavaScript Business Logic | npm workspaces; independent React/Vite JS apps; shared packages | Foundation tests, lint and both builds |
| 180 | JavaScript-Only Codebase | npm workspaces; independent React/Vite JS apps; shared packages | Foundation tests, lint and both builds |
| 181 | Runtime Type Safety | npm workspaces; independent React/Vite JS apps; shared packages | Foundation tests, lint and both builds |
| 182 | TanStack Query | npm workspaces; independent React/Vite JS apps; shared packages | Foundation tests, lint and both builds |
| 183 | React Hook Form | npm workspaces; independent React/Vite JS apps; shared packages | Foundation tests, lint and both builds |
| 184 | Zod Form Validation | npm workspaces; independent React/Vite JS apps; shared packages | Foundation tests, lint and both builds |
| 185 | Vercel Storefront Deployment | Two app-root Vercel configs; existing Nuede-V2 Git remote | Production projects/deployments NOT RUN; old nuede-2 is a different repository |
| 186 | Vercel Admin Deployment | Two app-root Vercel configs; existing Nuede-V2 Git remote | Production projects/deployments NOT RUN; old nuede-2 is a different repository |
| 187 | GitHub Integration | Two app-root Vercel configs; existing Nuede-V2 Git remote | Production projects/deployments NOT RUN; old nuede-2 is a different repository |
| 188 | Independent Application Builds | Independent app package build commands | Both production builds PASS |
| 189 | Secure Order Creation Function | Five JavaScript Edge Functions; protected checkout-settings operation | Engine/handler tests; deployed functions/settings authorization NOT RUN |
| 190 | Paystack Initialization Function | Five JavaScript Edge Functions; protected checkout-settings operation | Engine/handler tests; deployed functions/settings authorization NOT RUN |
| 191 | WhatsApp Order Creation Function | Five JavaScript Edge Functions; protected checkout-settings operation | Engine/handler tests; deployed functions/settings authorization NOT RUN |
| 192 | Paystack Webhook Function | Five JavaScript Edge Functions; protected checkout-settings operation | Engine/handler tests; deployed functions/settings authorization NOT RUN |
| 193 | Payment Verification Function | Five JavaScript Edge Functions; protected checkout-settings operation | Engine/handler tests; deployed functions/settings authorization NOT RUN |
| 194 | Checkout Settings Function | Five JavaScript Edge Functions; protected checkout-settings operation | Engine/handler tests; deployed functions/settings authorization NOT RUN |
| 195 | Fresh Supabase Data Setup | Migration chain, seed.sql, launch-readiness.sql and deployment runbook | Production initial data review/setup NOT RUN; development seed must not be published |
| 196 | Seed Data | Migration chain, seed.sql, launch-readiness.sql and deployment runbook | Production initial data review/setup NOT RUN; development seed must not be published |
| 197 | Initial Data Validation | Migration chain, seed.sql, launch-readiness.sql and deployment runbook | Production initial data review/setup NOT RUN; development seed must not be published |
| 198 | No V1 Migration Requirement | Migration chain, seed.sql, launch-readiness.sql and deployment runbook | Production initial data review/setup NOT RUN; development seed must not be published |
| 199 | Fresh-Site Launch | Migration chain, seed.sql, launch-readiness.sql and deployment runbook | Production initial data review/setup NOT RUN; development seed must not be published |
| 200 | No Legacy Saved-Meal or Meal-Plan Compatibility | Guest storage, permanent orders, verified payments, analytics and two-app architecture | Existing deterministic tests and mocked flows; real complete architecture NOT RUN |
| 201 | WhatsApp Is No Longer the Order Database | Guest storage, permanent orders, verified payments, analytics and two-app architecture | Existing deterministic tests and mocked flows; real complete architecture NOT RUN |
| 202 | Backend Determines Prices | Guest storage, permanent orders, verified payments, analytics and two-app architecture | Existing deterministic tests and mocked flows; real complete architecture NOT RUN |
| 203 | Automatic Payment Verification | Guest storage, permanent orders, verified payments, analytics and two-app architecture | Existing deterministic tests and mocked flows; real complete architecture NOT RUN |
| 204 | Historical Sales Records | Guest storage, permanent orders, verified payments, analytics and two-app architecture | Existing deterministic tests and mocked flows; real complete architecture NOT RUN |
| 205 | Dedicated Sales Analytics | Guest storage, permanent orders, verified payments, analytics and two-app architecture | Existing deterministic tests and mocked flows; real complete architecture NOT RUN |
| 206 | Separate Admin Application | Guest storage, permanent orders, verified payments, analytics and two-app architecture | Existing deterministic tests and mocked flows; real complete architecture NOT RUN |
| 207 | Admin-Controlled Checkout Payment Methods | Guest storage, permanent orders, verified payments, analytics and two-app architecture | Existing deterministic tests and mocked flows; real complete architecture NOT RUN |
| 208 | Customer Accounts Ready | Future-compatible architecture only; no customer accounts, tracking, discounts or inventory scope added | Architectural review; future product features intentionally not implemented for V2 launch |
| 209 | Order Tracking Ready | Future-compatible architecture only; no customer accounts, tracking, discounts or inventory scope added | Architectural review; future product features intentionally not implemented for V2 launch |
| 210 | Discount System Ready | Future-compatible architecture only; no customer accounts, tracking, discounts or inventory scope added | Architectural review; future product features intentionally not implemented for V2 launch |
| 211 | Inventory Ready | Future-compatible architecture only; no customer accounts, tracking, discounts or inventory scope added | Architectural review; future product features intentionally not implemented for V2 launch |
| 212 | Expanded Analytics Ready | Future-compatible architecture only; no customer accounts, tracking, discounts or inventory scope added | Architectural review; future product features intentionally not implemented for V2 launch |
