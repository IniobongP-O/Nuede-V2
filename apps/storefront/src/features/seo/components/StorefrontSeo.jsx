import { useLocation } from "react-router-dom";
import { faqs } from "../../content/config/storefrontContent.js";
import { useMenu } from "../../menu/hooks/useMenu.js";
import { breadcrumbSchema, faqSchema, organizationSchema, productSchema, websiteSchema } from "../schema/structuredData.js";
import { Seo } from "./Seo.jsx";

/** Selects truthful structured data for the current public route. */
export function StorefrontSeo() {
  const { pathname } = useLocation();
  const products = useMenu().data || [];
  const product = pathname.startsWith("/menu/") ? products.find((item) => `/menu/${item.slug}` === pathname) : null;
  const structuredData = [];
  if (pathname === "/") structuredData.push(websiteSchema(), organizationSchema());
  if (pathname === "/faq") structuredData.push(faqSchema(faqs));
  if (product) structuredData.push(productSchema(product), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Menu", path: "/menu" }, { name: product.name, path: pathname }]));
  return <Seo products={products} structuredData={structuredData} />;
}
