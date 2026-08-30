import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");
const requiredFiles = [
  "AGENTS.md",
  "docs/ARCHITECTURE.md",
  "docs/DECISIONS.md",
  "docs/PLAN.md",
  "docs/PROGRESS.md",
  "app/(public)/page.tsx",
  "app/(public)/blog/page.tsx",
  "app/(public)/blog/[slug]/page.tsx",
  "app/(public)/library/page.tsx",
  "app/(public)/loading.tsx",
  "app/(public)/error.tsx",
  "app/icon.svg",
  "public/opengraph-image.svg",
  ".github/workflows/deploy-pages.yml",
  "scripts/test-static.mjs",
  "lib/resources.ts"
];

for (const relativePath of requiredFiles) assert.ok(existsSync(path.join(root, relativePath)), `Missing required project file: ${relativePath}`);

const envExample = read(".env.example");
for (const variable of ["SITE_URL", "NEXT_PUBLIC_BASE_PATH"]) {
  assert.match(envExample, new RegExp(`^#?\\s*${variable}=`, "m"), `Missing environment documentation: ${variable}`);
}

const contentDirectory = path.join(root, "content", "blog");
const contentFiles = ["the-library-is-a-user-interface.md", "notes-on-controlled-sharing.md", "a-shelf-is-not-a-dashboard.md"];
for (const filename of contentFiles) {
  const source = read(path.join("content", "blog", filename));
  assert.match(source, /^---\r?\n[\s\S]*?\r?\n---\r?\n/, `Missing frontmatter: ${filename}`);
  assert.ok(source.split(/\r?\n\s*\r?\n/).length > 1, `Missing body content: ${filename}`);
}
assert.equal(existsSync(contentDirectory), true);

const trackedSource = read("lib/content.ts");
assert.match(trackedSource, /["']content["'],\s*["']blog["']/);
assert.doesNotMatch(read(".gitignore"), /^content\/blog/m, "Blog content must remain Git-tracked.");
const resourcesDirectory = path.join(root, "content", "resources");
assert.equal(existsSync(resourcesDirectory), true, "Public resource metadata directory is required.");
const localResourceHrefs = new Set();
for (const filename of readdirSync(resourcesDirectory).filter((entry) => entry.endsWith(".md"))) {
  const source = read(path.join("content", "resources", filename));
  const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(frontmatterMatch, "Missing resource frontmatter: " + filename);
  const fields = Object.fromEntries(frontmatterMatch[1].split(/\r?\n/).map((line) => {
    const separator = line.indexOf(":");
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^"(.*)"$/, "$1")];
  }));
  for (const field of ["title", "description", "sourceName", "type", "href"]) {
    assert.ok(fields[field], "Resource " + filename + " is missing " + field + ".");
  }
  if (fields.href.startsWith("/resources/")) {
    assert.match(fields.href, /^\/resources\/[^/]+\.pdf$/i, "Local resource must point to a PDF: " + filename);
    assert.ok(existsSync(path.join(root, "public", fields.href.slice(1))), "Resource file is missing: " + fields.href);
    localResourceHrefs.add(fields.href.toLowerCase());
  }
}
const publicResourcesDirectory = path.join(root, "public", "resources");
if (existsSync(publicResourcesDirectory)) for (const filename of readdirSync(publicResourcesDirectory)) {
  if (filename.toLowerCase().endsWith(".pdf")) assert.ok(localResourceHrefs.has(("/resources/" + filename).toLowerCase()), "PDF is missing a Library metadata entry: " + filename);
}
console.log(`PASS: project structure, environment documentation, and ${contentFiles.length} blog content files are intact.`);
