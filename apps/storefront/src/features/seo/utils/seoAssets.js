import { isIndexableProduct } from "./seoMetadata.js";

function xml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function createSitemap({ siteUrl, staticPaths, products }) {
  const productPaths = products.filter(isIndexableProduct).map((product) => ({ path: `/menu/${product.slug}`, lastmod: product.updatedAt || "" }));
  const entries = [...staticPaths.map((path) => ({ path, lastmod: "" })), ...productPaths].map((entry) => {
    const lastmod = entry.lastmod ? `\n    <lastmod>${xml(entry.lastmod)}</lastmod>` : "";
    return `  <url>\n    <loc>${xml(new URL(entry.path, `${siteUrl.replace(/\/+$/, "")}/`).href)}</loc>${lastmod}\n  </url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export function createRobotsTxt(siteUrl) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl.replace(/\/+$/, "")}/sitemap.xml\n`;
}
