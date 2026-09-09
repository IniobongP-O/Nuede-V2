import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { productSlugSchema, slugifyProductName, uniqueSlugCandidate } from "@nuede/validation/catalog";
import { createSeoMetadata, isIndexableProduct } from "../apps/storefront/src/features/seo/utils/seoMetadata.js";
import { productSchema } from "../apps/storefront/src/features/seo/schema/structuredData.js";
import { createRobotsTxt, createSitemap } from "../apps/storefront/src/features/seo/utils/seoAssets.js";

const product = { id: "p1", name: "Peppered Chicken Bowl", slug: "peppered-chicken-bowl", description: "Chicken and rice.", status: "available", menuStatus: "available", priceKobo: 650000, imageUrl: "https://images.example/meal.webp", updatedAt: "2026-09-08T10:00:00Z" };

test("Cycle 19 generates valid, stable product slug candidates", () => {
  assert.equal(slugifyProductName("  Herb & Salmon Plate! "), "herb-salmon-plate");
  assert.equal(slugifyProductName("Crème brûlée"), "creme-brulee");
  assert.equal(slugifyProductName("你好"), "");
  assert.equal(uniqueSlugCandidate("meal", ["meal", "meal-2", "other"]), "meal-3");
  assert.equal(productSlugSchema.safeParse("valid-meal-2").success, true);
  for (const invalid of ["", "Bad Slug", "-meal", "meal--plan", "checkout"]) {
    assert.equal(productSlugSchema.safeParse(invalid).success, false);
  }
});

test("Cycle 19 metadata is route-specific, canonical, and noindexes utilities", () => {
  const home = createSeoMetadata("/");
  const menu = createSeoMetadata("/menu");
  const detail = createSeoMetadata("/menu/peppered-chicken-bowl", [product]);
  assert.match(home.title, /Prepared Meals & Meal Plans in Abuja/);
  assert.notEqual(home.description, menu.description);
  assert.match(detail.title, /^Peppered Chicken Bowl/);
  assert.match(detail.canonical, /\/menu\/peppered-chicken-bowl$/);
  assert.equal(createSeoMetadata("/checkout").robots, "noindex,follow");
  assert.equal(createSeoMetadata("/missing").robots, "noindex,follow");
});

test("Cycle 19 product structured data is truthful across availability states", () => {
  const available = productSchema(product);
  const soldOut = productSchema({ ...product, status: "sold_out", menuStatus: "sold_out" });
  assert.equal(available.offers.price, "6500");
  assert.match(available.offers.availability, /InStock$/);
  assert.match(soldOut.offers.availability, /OutOfStock$/);
  assert.equal(productSchema({ ...product, status: "price_pending", priceKobo: null }), null);
  assert.equal("aggregateRating" in available, false);
  assert.equal("review" in available, false);
  assert.equal(isIndexableProduct({ ...product, status: "hidden" }), false);
  assert.equal(isIndexableProduct({ ...product, status: "archived" }), false);
  assert.equal(createSeoMetadata("/menu/peppered-chicken-bowl", [{ ...product, status: "hidden" }]).robots, "noindex,follow");
});

test("Cycle 19 sitemap and robots include only canonical public routes", () => {
  const products = [product, { ...product, id: "p2", slug: "hidden", status: "hidden" }, { ...product, id: "p3", slug: "archived", status: "archived" }];
  const sitemap = createSitemap({ siteUrl: "https://nuede.test", staticPaths: ["/", "/menu"], products });
  assert.match(sitemap, /https:\/\/nuede\.test\/menu\/peppered-chicken-bowl/);
  assert.doesNotMatch(sitemap, /\/hidden|\/archived|checkout|payment/);
  assert.match(sitemap, /2026-09-08T10:00:00Z/);
  const robots = createRobotsTxt("https://nuede.test/");
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/nuede\.test\/sitemap\.xml/);
  assert.equal(isIndexableProduct(product), true);
});

test("Cycle 19 slug migration preserves history behind RLS and trusted triggers", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20260909000100_harden_product_seo_slugs.sql", import.meta.url), "utf8");
  assert.match(migration, /create table public\.product_slug_redirects/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /product_slug_redirects_public_select/);
  assert.match(migration, /security definer/);
  assert.match(migration, /before update of slug on public\.products/);
  assert.doesNotMatch(migration, /grant (?:insert|update|delete)[^;]*product_slug_redirects[^;]*anon/is);
});
