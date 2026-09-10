import { seoConfig } from "../config/seoConfig.js";

export const INDEXABLE_STATIC_PATHS = Object.freeze([
  "/", "/menu", "/meal-plans", "/high-protein-meals", "/delivery/abuja", "/about", "/faq", "/contact",
]);
export const NOINDEX_PATHS = Object.freeze(["/saved", "/planner", "/checkout", "/payment"]);

const routeMetadata = {
  "/": [seoConfig.defaultTitle, seoConfig.defaultDescription],
  "/menu": ["Prepared Meals in Abuja | Nuede Menu", "Browse Nuede's current prepared-meal menu in Abuja, with live availability, prices, nutrition, meal options, and eligible add-ons."],
  "/meal-plans": ["Meal Plans in Abuja | Build Your Nuede Meal Plan", "Plan 2–7 days of Nuede meals in Abuja, compare nutrition across your selections, and continue through the existing secure checkout."],
  "/high-protein-meals": ["High-Protein Prepared Meals in Abuja | Nuede", "Explore Nuede meals whose published nutrition currently provides at least 30g of protein per displayed meal selection."],
  "/delivery/abuja": ["Prepared Meal Delivery in Abuja | Nuede", "Learn how Nuede prepared-meal delivery works in Abuja, then confirm the currently available area and delivery fee at checkout."],
  "/about": ["About Nuede | Prepared Meals in Abuja", "Learn how Nuede brings prepared meals, practical nutrition information, and flexible meal planning together for customers in Abuja."],
  "/faq": ["Nuede FAQs | Ordering, Meal Plans & Delivery", "Find clear answers about Nuede delivery in Abuja, meal customization, nutrition, meal planning, payment, and ordering."],
  "/contact": ["Contact Nuede | Prepared Meals in Abuja", "Use Nuede's verified, configured contact options for prepared-meal questions, ordering support, feedback, or delivery enquiries in Abuja."],
};

export function absoluteUrl(path = "/") {
  return new URL(path, `${seoConfig.siteUrl}/`).href;
}

export function isIndexableProduct(product) {
  return Boolean(product?.slug && !["hidden", "archived", "price_pending"].includes(product.status));
}

export function createSeoMetadata(pathname, products = []) {
  const cleanPath = pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
  const productMatch = cleanPath.match(/^\/menu\/([^/]+)$/);
  const product = productMatch ? products.find((item) => item.slug === decodeURIComponent(productMatch[1])) : null;
  let title;
  let description;
  let robots = "index,follow";
  let type = "website";
  let image = "";
  let canonicalPath = cleanPath;

  if (product) {
    title = `${product.name} | Prepared Meal in Abuja | Nuede`;
    description = product.description || `View ${product.name}, its current availability, price, nutrition, options, and eligible add-ons from Nuede in Abuja.`;
    robots = isIndexableProduct(product) ? "index,follow" : "noindex,follow";
    type = "product";
    image = product.imageUrl || "";
  } else if (routeMetadata[cleanPath]) {
    [title, description] = routeMetadata[cleanPath];
  } else {
    title = "Page not found | Nuede";
    description = "The requested Nuede page could not be found. Explore the current menu or return to the homepage.";
    robots = "noindex,follow";
    canonicalPath = null;
  }
  if (NOINDEX_PATHS.includes(cleanPath)) robots = "noindex,follow";
  if (seoConfig.previewDeployment) robots = "noindex,nofollow";
  const canonical = canonicalPath ? absoluteUrl(canonicalPath) : "";
  return { title, description, robots, canonical, openGraph: { title, description, url: canonical || absoluteUrl("/"), image, type, locale: seoConfig.locale } };
}
