import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const themeUrl = new URL("../packages/config/src/brand.css", import.meta.url);

test("the shared logo preserves the supplied photo's original artwork without redrawing", async () => {
  const logo = await readFile(new URL("../packages/config/src/nuede-logo.svg", import.meta.url), "utf8");
  assert.ok(logo.includes('viewBox="262 136 374 112"'));
  const image = logo.match(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/);
  assert.ok(image);
  assert.equal(createHash("sha256").update(Buffer.from(image[1], "base64")).digest("hex"), "a03c36de8734cc492341a54c69032d5d106fe4d73ccdacebc91a2c15412a125a");
  for (const file of [
    "storefront/src/components/layout/StorefrontHeader.jsx",
    "storefront/src/components/layout/StorefrontFooter.jsx",
    "admin/src/components/layout/AdminLayout.jsx",
    "admin/src/pages/LoginPage.jsx",
    "admin/src/features/auth/components/AuthStatusPage.jsx",
  ]) {
    const source = await readFile(new URL(`../apps/${file}`, import.meta.url), "utf8");
    assert.ok(source.includes('@nuede/config/nuede-logo.svg'));
    assert.ok(source.includes('alt="Nuede" width="374" height="112" className="h-auto w-32 shrink-0"'));
    assert.doesNotMatch(source, /Sprout|>nuede</);
  }
});

test("wider Poppins table labels remain contained by the existing scroll region", async () => {
  const table = await readFile(new URL("../apps/admin/src/components/ui/DataTable.jsx", import.meta.url), "utf8");
  assert.ok(table.includes('className="relative max-w-full overflow-x-auto"'));
  assert.ok(table.includes('role="region"'));
  assert.ok(table.includes('tabIndex="0"'));
});

test("both applications share the exact official brand palette", async () => {
  const theme = await readFile(themeUrl, "utf8");
  for (const [name, hex] of Object.entries({ green: "#096E21", "pale-yellow": "#FDF2A3", orange: "#FF7B16", gold: "#FFBD59" })) {
    assert.ok(theme.includes(`--nuede-${name}: ${hex};`));
  }
  assert.match(theme, /--color-brand-700: var\(--nuede-green\)/);
  for (const app of ["storefront", "admin"]) {
    const css = await readFile(new URL(`../apps/${app}/src/styles.css`, import.meta.url), "utf8");
    assert.ok(css.includes('@import "@nuede/config/brand.css"'));
  }
});

test("Poppins is self-hosted at every existing site weight", async () => {
  const theme = await readFile(themeUrl, "utf8");
  assert.match(theme, /--font-sans: "Poppins",/);
  assert.match(theme, /--font-display: "Poppins",/);
  assert.doesNotMatch(theme, /(?:url|@import)\s*\(?["']?https?:/);
  for (const [weight, name] of [[400, "Regular"], [500, "Medium"], [600, "SemiBold"], [700, "Bold"]]) {
    assert.ok(theme.includes(`font-weight: ${weight};`));
    assert.ok(theme.includes(`url("./fonts/Poppins-${name}.ttf")`));
    const font = await readFile(new URL(`./fonts/Poppins-${name}.ttf`, themeUrl));
    assert.equal(font.readUInt32BE(0), 0x00010000, "valid TrueType font header");
    assert.ok(font.length > 100000);
  }
  const license = await readFile(new URL("./fonts/OFL.txt", themeUrl), "utf8");
  assert.match(license, /SIL OPEN FONT LICENSE Version 1.1/);
});
