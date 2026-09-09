import { absoluteUrl, isIndexableProduct } from "../utils/seoMetadata.js";

function schemaPrice(kobo) {
  const value = BigInt(kobo); const whole = value / 100n; const fraction = value % 100n;
  return fraction === 0n ? whole.toString() : `${whole}.${fraction.toString().padStart(2, "0")}`;
}

export function websiteSchema() {
  return { "@context": "https://schema.org", "@type": "WebSite", name: "Nuede", url: absoluteUrl("/") };
}

export function organizationSchema() {
  return { "@context": "https://schema.org", "@type": "Organization", name: "Nuede", url: absoluteUrl("/") };
}

export function breadcrumbSchema(items) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })) };
}

export function productSchema(product) {
  if (!isIndexableProduct(product)) return null;
  const schema = {
    "@context": "https://schema.org", "@type": "Product", name: product.name,
    url: absoluteUrl(`/menu/${product.slug}`),
    description: product.description || undefined,
    image: product.imageUrl || undefined,
  };
  if (Number.isSafeInteger(product.priceKobo)) {
    schema.offers = {
      "@type": "Offer", priceCurrency: "NGN", price: schemaPrice(product.priceKobo),
      availability: `https://schema.org/${product.menuStatus === "available" ? "InStock" : "OutOfStock"}`,
      url: schema.url,
    };
  }
  return schema;
}

export function faqSchema(faqs) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
}
