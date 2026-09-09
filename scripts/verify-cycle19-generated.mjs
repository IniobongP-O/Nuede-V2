import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const dist = path.resolve(import.meta.dirname, "..", "apps", "storefront", "dist");
const homepage = await readFile(path.join(dist, "index.html"), "utf8");
const menu = await readFile(path.join(dist, "menu", "index.html"), "utf8");
const sitemap = await readFile(path.join(dist, "sitemap.xml"), "utf8");
const robots = await readFile(path.join(dist, "robots.txt"), "utf8");
for (const [name, html] of [["homepage", homepage], ["menu", menu]]) {
  assert.match(html, /<title>[^<]+<\/title>/, `${name} title`);
  assert.match(html, /<meta name="description"/, `${name} description`);
  assert.match(html, /<link rel="canonical"/, `${name} canonical`);
  assert.match(html, /<h1[^>]*>.+?<\/h1>/s, `${name} meaningful H1`);
}
assert.equal((homepage.match(/<h1(?:\s|>)/g) || []).length, 1, "homepage has exactly one H1");
assert.match(homepage, /application\/ld\+json/);
assert.match(menu, /\/menu\/[a-z0-9-]+/);
assert.doesNotMatch(sitemap, /checkout|payment|saved/);
assert.match(robots, /Sitemap: .*\/sitemap\.xml/);
for (const utility of ["saved", "checkout", "payment"]) {
  assert.match(await readFile(path.join(dist, utility, "index.html"), "utf8"), /noindex,follow/);
}
const productDirectories = (await readdir(path.join(dist, "menu"), { withFileTypes: true })).filter((entry) => entry.isDirectory());
assert.ok(productDirectories.length > 0, "at least one product was prerendered");
const firstProductSlug = sitemap.match(/\/menu\/([a-z0-9-]+)<\/loc>/)?.[1];
assert.ok(firstProductSlug, "sitemap contains a product route");
const productHtml = await readFile(path.join(dist, "menu", firstProductSlug, "index.html"), "utf8");
for (const pattern of [/application\/ld\+json/, /"@type":"Product"/, /"availability":"https:\/\/schema\.org\//, /Add to basket/, /<h1/]) assert.match(productHtml, pattern);
assert.match(await readFile(path.join(dist, "404.html"), "utf8"), /noindex,follow/);
console.log(`Cycle 19 generated SEO verification passed for ${productDirectories.length} product routes.`);
