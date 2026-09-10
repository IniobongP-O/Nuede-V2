import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { seoConfig } from "../config/seoConfig.js";
import { createSeoMetadata } from "../utils/seoMetadata.js";

function upsert(selector, tag, attributes) {
  let node = document.head.querySelector(selector);
  if (!node) { node = document.createElement(tag); document.head.append(node); }
  for (const [name, value] of Object.entries(attributes)) {
    if (value) node.setAttribute(name, value); else node.removeAttribute(name);
  }
  return node;
}

function remove(selector) { document.head.querySelector(selector)?.remove(); }

/** Owns route metadata during SPA navigation; build-time rendering uses the same metadata factory. */
export function Seo({ products = [], structuredData = [] }) {
  const { pathname, search } = useLocation();
  useEffect(() => {
    const metadata = createSeoMetadata(pathname, products);
    if (search && !seoConfig.previewDeployment) metadata.robots = "noindex,follow";
    document.title = metadata.title;
    upsert('meta[name="description"]', "meta", { name: "description", content: metadata.description });
    upsert('meta[name="robots"]', "meta", { name: "robots", content: metadata.robots });
    if (metadata.canonical) upsert('link[rel="canonical"]', "link", { rel: "canonical", href: metadata.canonical }); else remove('link[rel="canonical"]');
    for (const [property, content] of Object.entries({ "og:site_name": seoConfig.siteName, "og:title": metadata.openGraph.title, "og:description": metadata.openGraph.description, "og:url": metadata.openGraph.url, "og:type": metadata.openGraph.type, "og:locale": metadata.openGraph.locale, "og:image": metadata.openGraph.image })) upsert(`meta[property="${property}"]`, "meta", { property, content });
    upsert('meta[name="twitter:card"]', "meta", { name: "twitter:card", content: metadata.openGraph.image ? "summary_large_image" : "summary" });
    upsert('meta[name="twitter:title"]', "meta", { name: "twitter:title", content: metadata.title });
    upsert('meta[name="twitter:description"]', "meta", { name: "twitter:description", content: metadata.description });
    if (metadata.openGraph.image) upsert('meta[name="twitter:image"]', "meta", { name: "twitter:image", content: metadata.openGraph.image }); else remove('meta[name="twitter:image"]');
    if (seoConfig.searchConsoleVerification) upsert('meta[name="google-site-verification"]', "meta", { name: "google-site-verification", content: seoConfig.searchConsoleVerification });
    document.querySelectorAll("script[data-nuede-json-ld]").forEach((node) => node.remove());
    structuredData.filter(Boolean).forEach((value) => { const node = document.createElement("script"); node.type = "application/ld+json"; node.dataset.nuedeJsonLd = "true"; node.textContent = JSON.stringify(value).replace(/</g, "\\u003c"); document.head.append(node); });
  }, [pathname, search, products, structuredData]);
  return null;
}
