import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function source(relativePath) {
  return readFile(path.join(repositoryRoot, relativePath), "utf8");
}

for (const app of ["storefront", "admin"]) {
  test(`${app} has startup and route-level failure recovery`, async () => {
    const boundaryName = app === "storefront" ? "StorefrontErrorBoundary" : "AdminErrorBoundary";
    const pageName = app === "storefront" ? "StorefrontErrorPage" : "AdminErrorPage";
    const [main, router, errorPage] = await Promise.all([
      source(`apps/${app}/src/main.jsx`),
      source(`apps/${app}/src/app/router.jsx`),
      source(`apps/${app}/src/pages/${pageName}.jsx`),
    ]);

    assert.match(main, new RegExp(`<${boundaryName}>`));
    assert.match(router, new RegExp(`errorElement: <${pageName} \\/>`));
    assert.match(errorPage, /getDerivedStateFromError/);
    assert.match(errorPage, /window\.location\.reload\(\)/);
    assert.match(errorPage, /role="alert"/);
  });
}
