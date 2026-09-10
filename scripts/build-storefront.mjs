import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build, loadEnv } from "vite";
import { getDeploymentEnvironment, mergePublicEnvironment, validatePublicEnvironment } from "./public-environment.js";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const appRoot = path.join(repositoryRoot, "apps", "storefront");
const distRoot = path.join(appRoot, "dist");
const ssrRoot = path.join(appRoot, ".seo-ssr");
const deploymentEnvironment = getDeploymentEnvironment();
const production = deploymentEnvironment === "production";
const preview = deploymentEnvironment === "preview";
const mode = process.env.NODE_ENV === "development" ? "development" : "production";
const publicEnv = validatePublicEnvironment(mergePublicEnvironment(loadEnv(mode, appRoot, "VITE_"), process.env), {
  production,
  requireCanonical: production || preview,
});

await build({ root: appRoot, configFile: path.join(appRoot, "vite.config.js"), mode });
await build({ root: appRoot, configFile: path.join(appRoot, "vite.config.js"), mode, build: { ssr: "src/entry-server.jsx", outDir: ".seo-ssr", emptyOutDir: true } });

try {
  const server = await import(`${pathToFileURL(path.join(ssrRoot, "entry-server.js")).href}?v=${Date.now()}`);
  const { createRobotsTxt, createSitemap } = await import(pathToFileURL(path.join(appRoot, "src", "features", "seo", "utils", "seoAssets.js")).href);
  let catalog;
  try { catalog = await server.loadPrerenderCatalog({ strictRedirects: production }); }
  catch (error) {
    if (production) throw new Error("Production SEO generation could not load the public catalog.", { cause: error });
    console.warn("SEO build: public catalog unavailable; generated static landing pages without product entries.");
    catalog = { categories: [], products: [], redirects: [] };
  }
  const template = await readFile(path.join(distRoot, "index.html"), "utf8");
  const siteUrl = publicEnv.VITE_PUBLIC_SITE_URL || "http://localhost:5175";
  const staticPaths = ["/", "/menu", "/meal-plans", "/high-protein-meals", "/delivery/abuja", "/about", "/faq", "/contact"];
  const publicProducts = catalog.products.filter((product) => product.slug && !["hidden", "archived", "price_pending"].includes(product.status));
  if (production && publicProducts.length === 0) throw new Error("Production SEO generation found no indexable products; refusing to publish an empty product sitemap.");
  const productPaths = publicProducts.map((product) => `/menu/${product.slug}`);
  const dataJson = JSON.stringify(catalog).replace(/</g, "\\u003c");

  const escape = (value) => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function headFor(pathname) {
    const { metadata, schemas } = server.seoForPath(pathname, catalog.products);
    return [
      `<meta name="description" content="${escape(metadata.description)}">`,
      `<meta name="robots" content="${escape(metadata.robots)}">`,
      metadata.canonical ? `<link rel="canonical" href="${escape(metadata.canonical)}">` : "",
      `<meta property="og:site_name" content="Nuede">`,
      `<meta property="og:title" content="${escape(metadata.openGraph.title)}">`,
      `<meta property="og:description" content="${escape(metadata.openGraph.description)}">`,
      `<meta property="og:url" content="${escape(metadata.openGraph.url)}">`,
      `<meta property="og:type" content="${escape(metadata.openGraph.type)}">`,
      `<meta property="og:locale" content="${escape(metadata.openGraph.locale)}">`,
      metadata.openGraph.image ? `<meta property="og:image" content="${escape(metadata.openGraph.image)}">` : "",
      `<meta name="twitter:card" content="${metadata.openGraph.image ? "summary_large_image" : "summary"}">`,
      `<meta name="twitter:title" content="${escape(metadata.title)}">`,
      `<meta name="twitter:description" content="${escape(metadata.description)}">`,
      metadata.openGraph.image ? `<meta name="twitter:image" content="${escape(metadata.openGraph.image)}">` : "",
      publicEnv.VITE_GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${escape(publicEnv.VITE_GOOGLE_SITE_VERIFICATION)}">` : "",
      ...schemas.map((schema) => `<script type="application/ld+json" data-nuede-json-ld>${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`),
    ].filter(Boolean).join("\n    ");
  }
  async function emit(pathname, { prerender = true } = {}) {
    const appHtml = prerender ? server.render(pathname, catalog) : "";
    const metadata = server.seoForPath(pathname, catalog.products).metadata;
    const html = template
      .replace("<!--seo-head-->", headFor(pathname))
      .replace(/<title>.*?<\/title>/, `<title>${escape(metadata.title)}</title>`)
      .replace("<!--app-html-->", appHtml)
      .replace("<!--prerender-data-->", prerender ? `<script id="nuede-prerender-data" type="application/json">${dataJson}</script>` : "");
    const target = pathname === "/" ? path.join(distRoot, "index.html") : path.join(distRoot, pathname.slice(1), "index.html");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html);
  }
  for (const pathname of [...staticPaths, ...productPaths]) await emit(pathname);
  const historicalRedirects = catalog.redirects.flatMap((redirect) => {
    const product = publicProducts.find((item) => item.id === redirect.product_id);
    return product && redirect.slug !== product.slug ? [{ from: `/menu/${redirect.slug}`, to: `/menu/${product.slug}`, product }] : [];
  });
  for (const redirect of historicalRedirects) {
    const canonical = new URL(redirect.to, `${siteUrl}/`).href;
    const html = template
      .replace("<!--seo-head-->", `<meta name="description" content="This Nuede meal URL has moved.">\n    <meta name="robots" content="${preview ? "noindex,nofollow" : "noindex,follow"}">\n    <link rel="canonical" href="${escape(canonical)}">\n    <meta http-equiv="refresh" content="0;url=${escape(redirect.to)}">`)
      .replace(/<title>.*?<\/title>/, `<title>${escape(redirect.product.name)} | Nuede</title>`)
      .replace("<!--app-html-->", "")
      .replace("<!--prerender-data-->", `<script id="nuede-prerender-data" type="application/json">${dataJson}</script>`);
    const target = path.join(distRoot, redirect.from.slice(1), "index.html");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html);
  }
  for (const pathname of ["/saved", "/planner", "/checkout", "/payment"]) await emit(pathname, { prerender: false });
  const notFound = template.replace("<!--seo-head-->", headFor("/404")).replace(/<title>.*?<\/title>/, "<title>Page not found | Nuede</title>").replace("<!--app-html-->", "").replace("<!--prerender-data-->", "");
  await writeFile(path.join(distRoot, "404.html"), notFound);

  await writeFile(path.join(distRoot, "sitemap.xml"), createSitemap({ siteUrl, staticPaths, products: publicProducts }));
  await writeFile(path.join(distRoot, "robots.txt"), createRobotsTxt(siteUrl, { disallowAll: preview }));
  const generated = await Promise.all([...staticPaths, ...productPaths].map(async (pathname) => readFile(pathname === "/" ? path.join(distRoot, "index.html") : path.join(distRoot, pathname.slice(1), "index.html"), "utf8")));
  if (generated.some((html) => !html.includes('rel="canonical"') || !html.includes('<meta name="description"') || /localhost|\.vercel\.app/.test(html) && (production || preview))) throw new Error("Generated SEO HTML failed canonical metadata assertions.");
  if (preview && generated.some((html) => !html.includes('<meta name="robots" content="noindex,nofollow">'))) throw new Error("Preview SEO HTML failed noindex assertions.");
  console.log(`SEO build: prerendered ${staticPaths.length} landing routes, ${productPaths.length} product routes, and ${historicalRedirects.length} historical slug redirects.`);
} finally {
  await rm(ssrRoot, { recursive: true, force: true });
}
