import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
console.log(`PASS: project structure, environment documentation, and ${contentFiles.length} blog content files are intact.`);
