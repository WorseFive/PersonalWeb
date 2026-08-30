import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");
const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split(/\r?\n/).filter(Boolean);

assert.equal(tracked.some((file) => file === ".env.local" || file === ".env" || file.startsWith(".data/")), false, "Local secrets/data must not be tracked.");
const ignore = read(".gitignore");
for (const entry of [".env.local", ".data/", ".vercel/", "node_modules/"]) assert.match(ignore, new RegExp(`^${entry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m"), `Missing ignore rule: ${entry}`);

const staticSource = [
  read("next.config.ts"),
  read("app/layout.tsx"),
  read("app/sitemap.ts"),
  read("components/site-header.tsx"),
  read("app/(public)/page.tsx"),
  read("app/(public)/about/page.tsx"),
  read("app/(public)/blog/[slug]/page.tsx"),
  read("app/(public)/library/page.tsx")
].join("\n");
assert.match(staticSource, /output:\s*["']export["']/);
assert.match(staticSource, /trailingSlash:\s*true/);
assert.match(staticSource, /dynamicParams\s*=\s*false/);
assert.doesNotMatch(staticSource, /\/admin|\/api\/|CommentSection|listPublishedComments|force-dynamic/);
assert.match(read("app/robots.ts"), /force-static/);
assert.doesNotMatch(read("components/site-header.tsx"), /Admin/);
assert.doesNotMatch(read("app/(public)/page.tsx"), /Control Room|\/admin/);
assert.doesNotMatch(read("app/(public)/about/page.tsx"), /comments wait|administrator session|private object storage/);
assert.match(read("docs/PLAN.md"), /GitHub Pages/);
assert.match(read("docs/PROGRESS.md"), /npm run verify/);
console.log("PASS: release boundary keeps local secrets/data ignored and static pages free of dynamic admin, API, comment, and upload claims.");
