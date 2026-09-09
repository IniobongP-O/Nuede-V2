import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./App.jsx";
import { StorefrontErrorBoundary } from "./pages/StorefrontErrorPage.jsx";
import { createStorefrontQueryClient } from "./lib/queryClient.js";
import { getCategories, getMenuProducts, getProductSlugRedirects } from "./features/menu/api/menuApi.js";
import { menuQueryKeys } from "./features/menu/hooks/useMenu.js";
import { createSeoMetadata } from "./features/seo/utils/seoMetadata.js";
import { breadcrumbSchema, faqSchema, organizationSchema, productSchema, websiteSchema } from "./features/seo/schema/structuredData.js";
import { faqs } from "./features/content/config/storefrontContent.js";

export async function loadPrerenderCatalog({ strictRedirects = false } = {}) {
  const redirectsQuery = getProductSlugRedirects().catch((error) => { if (strictRedirects) throw error; return []; });
  const [categories, products, redirects] = await Promise.all([getCategories(), getMenuProducts(), redirectsQuery]);
  return { categories, products, redirects };
}

export function seoForPath(pathname, products) {
  const metadata = createSeoMetadata(pathname, products);
  const schemas = [];
  if (pathname === "/") schemas.push(websiteSchema(), organizationSchema());
  if (pathname === "/faq") schemas.push(faqSchema(faqs));
  const product = products.find((item) => `/menu/${item.slug}` === pathname);
  if (product) schemas.push(productSchema(product), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Menu", path: "/menu" }, { name: product.name, path: pathname }]));
  return { metadata, schemas: schemas.filter(Boolean) };
}

export function render(pathname, catalog) {
  const queryClient = createStorefrontQueryClient();
  queryClient.setQueryData(menuQueryKeys.categories, catalog.categories);
  queryClient.setQueryData(menuQueryKeys.products, catalog.products);
  queryClient.setQueryData(menuQueryKeys.redirects, catalog.redirects);
  return renderToString(<StrictMode><StorefrontErrorBoundary><App location={pathname} queryClient={queryClient} /></StorefrontErrorBoundary></StrictMode>);
}
