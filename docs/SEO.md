# Nuede storefront SEO

## Architecture

Cycle 19 keeps the two React/Vite applications and the existing Supabase commerce model. The storefront uses Vite's SSR build and React's server renderer only during `npm run build:storefront`. It loads the anonymous public catalog once, seeds the same TanStack Query keys used in the browser, and renders the shared route tree into static HTML. The browser receives the same normalized catalog snapshot in a non-executable `application/json` element and hydrates it before normal live-query refresh and Realtime invalidation resume.

No pricing or ordering authority moved into prerendering. Product URLs identify a product by slug for routing only. Add-to-basket still emits the existing `{ productId, variantId, addonIds, quantity }` configuration, and checkout/Edge Functions still revalidate stable IDs and authoritative integer-kobo values.

The build emits route-local `index.html` files instead of a catch-all SPA rewrite. This lets Vercel serve generated public and utility routes from the filesystem and return a genuine HTTP 404 for an unknown direct URL, with `404.html` as the noindex error document. Client-side React Router navigation continues to work normally.

## Current domain strategy

Nuede may use its stable Vercel production project URL as a temporary canonical origin until a custom domain is connected. The storefront resolves one normalized canonical origin in this order:

1. `VITE_PUBLIC_SITE_URL`, when explicitly configured;
2. `https://${VERCEL_PROJECT_PRODUCTION_URL}` on Vercel, while that trusted system value is the project's `*.vercel.app` production hostname;
3. `http://localhost:5175` for local development and ordinary local builds only.

Production and Preview builds fail with an actionable error if neither supported production origin is available. `VERCEL_URL` and `VERCEL_BRANCH_URL` are deployment-specific and are never considered by the resolver. A Preview deployment therefore uses the same production canonical origin while every page receives `noindex,nofollow` metadata and Preview `robots.txt` disallows crawling. Production is not noindexed.

Vercel documents `VERCEL_PROJECT_PRODUCTION_URL` as a build-time and runtime system variable that is also present on Preview deployments and does not include the `https://` scheme. When no custom domain exists, it supplies the stable Vercel project production hostname. The build reads this system variable only in Node and injects the resolved public origin; it does not expose the raw system variable or merge arbitrary `process.env` values into the browser configuration.

`VITE_PUBLIC_SITE_URL` remains the permanent-domain override and is public configuration, not a secret. When set, it must:

- use HTTPS;
- be a root URL with no path, query, or fragment;
- contain no username or password;
- be the approved permanent domain, not localhost, an IP loopback, or a placeholder/example domain.

A manually supplied `*.vercel.app` value is accepted only when it exactly matches the trusted `VERCEL_PROJECT_PRODUCTION_URL` hostname on Vercel. Random deployment, branch, and Preview hostnames remain rejected.

## Custom canonical domain setup

Once a real custom domain is ready, configure it manually in **Storefront Vercel project → Settings → Environment Variables**:

```text
Name: VITE_PUBLIC_SITE_URL
Value: https://YOUR-REAL-PRODUCTION-DOMAIN
Environment: Production
```

Set it for both **Production** and **Preview** so the permanent custom domain wins everywhere. No code change is required. The migration checklist is:

1. Configure the custom domain in Vercel.
2. Choose one canonical form: apex or `www`.
3. Redirect the alternate hostname to that canonical hostname.
4. Set `VITE_PUBLIC_SITE_URL=https://CANONICAL-DOMAIN` for Production and Preview.
5. Redeploy so canonical metadata and the sitemap are regenerated.
6. Update Google Search Console and submit the new sitemap.
7. Keep the old Vercel hostname from competing in search through the domain redirect/canonical configuration.

Do not add a redirect before the real custom domain exists. The temporary Vercel fallback should eventually be replaced by this explicit custom-domain setting.

## Other public configuration

- `VITE_GOOGLE_SITE_VERIFICATION`: optional Search Console HTML-tag token. Leave empty until Google issues the real token.

Keep the existing `VITE_SUPABASE_URL`, public/publishable key, and optional `VITE_CONTACT_*` values. These are public browser values; never place service-role, database, Paystack, or other backend secrets in a `VITE_` variable.

## Route policy

Indexable routes are `/`, `/menu`, current public `/menu/:slug` pages, `/meal-plans`, `/high-protein-meals`, `/delivery/abuja`, `/about`, `/faq`, and `/contact`.

`/saved`, `/planner`, `/checkout`, and `/payment` are emitted with `noindex,follow` and excluded from the sitemap. Unknown routes, invalid/private product slugs, and `404.html` are also noindex. Query-string menu states are canonicalized to `/menu` and receive `noindex,follow` during client navigation, preventing filter/search combinations from becoming duplicate landing pages.

Available, sold-out, and legitimate public unavailable products can remain indexable. Hidden, archived, deleted, invalid, and price-pending products are excluded from product prerendering and the sitemap. RLS and enabled-category relationships remain the primary public-data boundary.

## Product slugs and redirects

`products.id` remains relational and commerce identity. `products.slug` is a unique public routing identity. New products derive a lowercase ASCII, single-hyphen slug once; duplicate generated names receive the next numeric suffix. Existing slugs are preserved when a name changes. Slugs are limited to 120 characters and cannot collide with reserved storefront routes.

Migration `20260909000100_harden_product_seo_slugs.sql` adds the length/reserved constraints and `product_slug_redirects`. A database trigger records the previous slug when an authorized admin explicitly changes it and rejects reuse by another product. Public RLS exposes redirect rows only while their target product and category remain public. The build emits historical-slug HTML with a canonical link, noindex, immediate browser redirect, and a client-side replace navigation. Because this static Vite deployment has no request-time database middleware, those historical paths are not HTTP 301/308 responses; if strict permanent response codes become an operational requirement, generate Vercel redirect configuration from the same table in a controlled deployment step.

The admin catalog list displays each current `/menu/<slug>` alongside the meal. Slug generation and persistence run through the existing authorized catalog API; no public mutation endpoint was added.

## Metadata and structured data

`features/seo` centralizes the site origin, titles, descriptions, canonicals, robots rules, Open Graph/Twitter fields, Search Console verification, JSON-LD, and sitemap/robots helpers. Build HTML and SPA navigation both use `createSeoMetadata`, so navigation updates existing head elements rather than accumulating duplicates.

The homepage emits truthful `WebSite` and `Organization` data. Product pages emit `Product`, `Offer` only when a public price exists, and breadcrumbs. Offer availability maps current `available` to `InStock` and other public non-orderable states to `OutOfStock`. FAQ JSON-LD is generated from the visible FAQ content. No review, rating, address, hours, telephone, social profile, or local-business field is invented. JSON-LD remains a non-executable `application/ld+json` script; the existing CSP is not weakened with `unsafe-inline` for executable scripts.

## Sitemap, robots, and rebuilds

`/sitemap.xml` is generated from the static route manifest and the current anonymous catalog. Product `updated_at` supplies `lastmod`; static pages do not receive fabricated timestamps. Hidden, archived, price-pending, admin, utility, preview, and query-string URLs are omitted. `/robots.txt` allows public crawling and references the absolute canonical sitemap. Both assets receive conservative CDN caching while checkout/order content does not.

Product or editorial changes reach initial HTML on the next production build. Realtime updates still refresh hydrated customer sessions, but search HTML and the sitemap intentionally represent the successful deployment snapshot. Trigger a new storefront deployment after publishing, hiding, archiving, repricing, renaming, or changing the slug of a product.

Production builds fail if the canonical origin or Supabase public configuration is unsafe, catalog loading fails, no indexable product exists, or generated canonical metadata is malformed. Missing Search Console verification and optional social/contact values do not fail the build.

## Performance and page quality

Product images retain explicit aspect ratios, lazy loading on menu cards, eager loading only for the hero/direct detail, asynchronous decoding, and a missing/error fallback. The build avoids a new runtime SEO dependency. Keep monitoring LCP, CLS, and INP in production; practical targets are LCP below 2.5 seconds, CLS below 0.1, and INP below 200 milliseconds at the 75th percentile.

Before publishing a new landing page, require useful unique customer content, a single descriptive H1, a unique title/description, one canonical, truthful structured data only when supported, internal links, responsive/accessibility review, inclusion in the centralized route policy, a generated-source check, and a reason for the page to exist beyond a keyword variation. Do not create thin neighbourhood pages, doorway pages, repetitive keyword blocks, or fabricated local/review data.

## Verification

Run:

```text
npm run lint
npm test
npm run build:storefront
npm run build:admin
npm run test:seo
```

Inspect page source, not only the hydrated DOM. Confirm the homepage has one H1; menu and one product contain useful text without JavaScript; every public page has one title, description, canonical, and robots rule; product JSON-LD matches live price/status; sitemap and robots use the approved domain; utilities are noindex; unknown URLs return 404; and admin responses retain `X-Robots-Tag: noindex, nofollow`.

Lighthouse should be run against the deployed production build for `/`, `/menu`, one product, and `/meal-plans`. Target SEO 100 and performance at least 90 where representative network/device runs make that reproducible. Do not remove functionality or conceal content to improve a score.

## Search Console and local SEO after deployment

These are operator actions and are not completed by source code:

1. Verify the approved production domain in Google Search Console using the real token or DNS method.
2. Submit `/sitemap.xml`.
3. Inspect `/`, `/menu`, and at least one public product URL; confirm Google's selected canonical and request indexing where appropriate.
4. Monitor Page Indexing, Core Web Vitals, product/structured-data enhancements, 404s, search queries, and landing pages.
5. Recheck source and response headers after every routing, CSP, domain, or deployment-platform change.
6. Configure the real Google Business Profile with the accurate business name, category, website, contact details, service area, hours, photos, ordering URL, and delivery information. Do not copy unverified profile details into code.

The owner must also verify social share previews on the deployed domain. A default social image is optional; product images are used only when supplied by the live catalog.
