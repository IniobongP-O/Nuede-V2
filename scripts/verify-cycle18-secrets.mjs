import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { containsBackendSecret } from "./public-environment.js";

const tracked = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const files = new Set(tracked);
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(name);
    else files.add(name);
  }
}
// Missing build artifacts are a failed scan, never an implicit clean result.
for (const app of ["storefront", "admin"]) await collect(`apps/${app}/dist`);
const violations = [];
for (const file of files) {
  if (/(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith(".env.example")) violations.push(`${file}: tracked environment file`);
  if (/\.(?:png|jpg|jpeg|webp|ico|woff2?|pdf)$/.test(file)) continue;
  const content = await readFile(file, "utf8");
  if (containsBackendSecret(content)) violations.push(`${file}: backend credential pattern`);
}
if (violations.length) {
  console.error(violations.join("\n"));
  process.exitCode = 1;
} else console.log(`PASS secret scan: ${files.size} tracked/built files; no backend credential patterns or tracked real env files. Pattern scan is not credential-history proof.`);
