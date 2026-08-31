import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredPaths = [
  "apps/storefront/package.json",
  "apps/storefront/src/App.jsx",
  "apps/admin/package.json",
  "apps/admin/src/App.jsx",
  "packages/domain/package.json",
  "packages/validation/package.json",
  "packages/config/package.json",
  "supabase/migrations/README.md",
  "supabase/functions/README.md",
  "supabase/seed.sql",
  "docs/ARCHITECTURE.md",
  "docs/DATABASE.md",
  "docs/SECURITY.md",
  "docs/FEATURES.md",
  "docs/DEVELOPMENT.md",
  "docs/TRACEABILITY.md",
];

const forbiddenExtensions = new Set([".ts", ".tsx", ".mts", ".cts"]);
const forbiddenPackages = new Set([
  "typescript",
  "next",
  "firebase",
  "express",
  "nx",
  "turbo",
  "turborepo",
]);

async function readJson(relativePath) {
  const contents = await readFile(path.join(repositoryRoot, relativePath), "utf8");
  return JSON.parse(contents);
}

async function walk(relativeDirectory = "") {
  const absoluteDirectory = path.join(repositoryRoot, relativeDirectory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if ([".git", "node_modules", "dist", "coverage"].includes(entry.name)) {
      continue;
    }

    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(relativePath)));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

function dependencyNames(packageJson) {
  return Object.keys({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
    ...packageJson.optionalDependencies,
  });
}

test("required Cycle 0 paths exist", async () => {
  for (const relativePath of requiredPaths) {
    const details = await stat(path.join(repositoryRoot, relativePath));
    assert.ok(details.isFile(), `${relativePath} must be a file`);
  }
});

test("root workspace and application scripts preserve independent applications", async () => {
  const rootPackage = await readJson("package.json");
  const storefrontPackage = await readJson("apps/storefront/package.json");
  const adminPackage = await readJson("apps/admin/package.json");

  assert.equal(rootPackage.private, true);
  assert.deepEqual(rootPackage.workspaces, ["apps/*", "packages/*"]);
  assert.equal(storefrontPackage.name, "@nuede/storefront");
  assert.equal(adminPackage.name, "@nuede/admin");
  assert.equal(typeof rootPackage.scripts["dev:storefront"], "string");
  assert.equal(typeof rootPackage.scripts["dev:admin"], "string");
  assert.equal(typeof rootPackage.scripts["build:storefront"], "string");
  assert.equal(typeof rootPackage.scripts["build:admin"], "string");
});

test("project source and configuration remain JavaScript-only", async () => {
  const files = await walk();
  const forbiddenFiles = files.filter((file) => forbiddenExtensions.has(path.extname(file)));
  assert.deepEqual(forbiddenFiles, []);
});

test("prohibited architectural dependencies are absent", async () => {
  const packageFiles = [
    "package.json",
    "apps/storefront/package.json",
    "apps/admin/package.json",
    "packages/domain/package.json",
    "packages/validation/package.json",
    "packages/config/package.json",
  ];

  for (const packageFile of packageFiles) {
    const packageJson = await readJson(packageFile);
    const violations = dependencyNames(packageJson).filter((name) => forbiddenPackages.has(name));
    assert.deepEqual(violations, [], `${packageFile} contains prohibited dependencies`);
  }
});

test("shared packages do not depend on application packages", async () => {
  const sharedPackageFiles = [
    "packages/domain/package.json",
    "packages/validation/package.json",
    "packages/config/package.json",
  ];

  for (const packageFile of sharedPackageFiles) {
    const packageJson = await readJson(packageFile);
    const applicationDependencies = dependencyNames(packageJson).filter((name) =>
      ["@nuede/storefront", "@nuede/admin"].includes(name),
    );
    assert.deepEqual(applicationDependencies, [], `${packageFile} must not depend on an application`);
  }
});

test("only environment examples are present and their values are placeholders", async () => {
  const files = await walk();
  const environmentFiles = files.filter((file) => path.basename(file).startsWith(".env"));

  assert.ok(environmentFiles.length > 0);
  assert.ok(environmentFiles.every((file) => path.basename(file) === ".env.example"));

  for (const environmentFile of environmentFiles) {
    const lines = (await readFile(path.join(repositoryRoot, environmentFile), "utf8"))
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"));

    for (const line of lines) {
      const value = line.slice(line.indexOf("=") + 1);
      assert.ok(
        value === "" || value.includes("your-") || value.includes("example"),
        `${environmentFile} must contain placeholder values only`,
      );
    }
  }
});
