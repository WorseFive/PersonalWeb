import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "out");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");
const files = [];
function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(fullPath);
    else files.push(path.relative(output, fullPath).replaceAll(path.sep, "/"));
  }
}

assert.ok(existsSync(output), "Static output directory out/ is missing. Run npm run build first.");
collect(output);
for (const relativePath of [
  "index.html",
  "about/index.html",
  "blog/index.html",
  "library/index.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "icon.svg",
  "opengraph-image.svg"
]) assert.ok(files.includes(relativePath), `Missing static output: ${relativePath}`);

for (const slug of ["the-library-is-a-user-interface", "notes-on-controlled-sharing", "a-shelf-is-not-a-dashboard"]) {
  assert.ok(files.includes(`blog/${slug}/index.html`), `Missing article output: ${slug}`);
}

const html = files.filter((file) => file.endsWith(".html")).map((file) => readFileSync(path.join(output, file), "utf8")).join("\n");
const resourceHrefs = new Set();
const resourceDirectory = path.join(root, "content", "resources");
if (existsSync(resourceDirectory)) for (const filename of readdirSync(resourceDirectory).filter((entry) => entry.endsWith(".md"))) {
  const source = readFileSync(path.join(resourceDirectory, filename), "utf8");
  const href = source.match(/^href:\s*"?([^"\r\n]+)"?\s*$/m)?.[1];
  if (href?.startsWith("/resources/")) {
    resourceHrefs.add(href.toLowerCase());
    assert.ok(files.includes(href.slice(1)), "Library resource is missing from static output: " + href);
  }
}
for (const file of files.filter((entry) => entry.startsWith("resources/") && entry.toLowerCase().endsWith(".pdf"))) {
  assert.ok(resourceHrefs.has(("/" + file).toLowerCase()), "Static PDF is missing a Library metadata entry: " + file);
}
for (const forbidden of ["SUPABASE_SERVICE_ROLE_KEY", "ADMIN_PASSWORD", "SESSION_SECRET", "RATE_LIMIT_SECRET", "/admin", "/api/comments", "Control Room", "CommentSection"]) {
  assert.doesNotMatch(html, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Forbidden release content found: ${forbidden}`);
}
const expectedBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";
if (expectedBasePath) assert.match(html, new RegExp(`${expectedBasePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`), "Expected project-site base path is missing from generated HTML.");
const localReferences = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]).filter((reference) => reference.startsWith("/"));
if (expectedBasePath) for (const reference of localReferences) assert.ok(reference === expectedBasePath || reference.startsWith(`${expectedBasePath}/`), `Local asset/link is missing the Pages base path: ${reference}`);
assert.doesNotMatch(read("out/sitemap.xml"), /localhost|127\.0\.0\.1|vercel\.app|render\.com|supabase\.co/);
const expectedSiteUrl = process.env.SITE_URL?.trim();
if (expectedSiteUrl) assert.match(read("out/robots.txt"), new RegExp(`Sitemap: ${expectedSiteUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}sitemap\\.xml`));
assert.ok(files.every((file) => !/(^|\/)(\.env|\.data|\.vercel|\.git)(\/|$)/.test(file)), "Private build directories entered out/.");

const oversized = files.filter((file) => statSync(path.join(output, file)).size > 10 * 1024 * 1024);
assert.deepEqual(oversized, [], `Unexpectedly large static files: ${oversized.join(", ")}`);
console.log(`PASS: static output contains ${files.length} files, all required routes/assets, no secrets or dynamic-entry claims, and the GitHub Pages base path.`);
