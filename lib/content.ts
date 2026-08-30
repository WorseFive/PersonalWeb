import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  cover: "blue" | "coral" | "green";
  tags: string[];
  paragraphs: string[];
};

const postSlugs = [
  "the-library-is-a-user-interface",
  "notes-on-controlled-sharing",
  "a-shelf-is-not-a-dashboard"
] as const;

function parseFrontmatter(source: string) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("Blog content must contain YAML-like frontmatter.");
  const fields = Object.fromEntries(match[1].split(/\r?\n/).map((line) => {
    const separator = line.indexOf(":");
    if (separator < 0) throw new Error(`Invalid blog frontmatter line: ${line}`);
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }));
  return { fields, body: match[2].trim() };
}

function readPost(slug: string): Post {
  const source = readFileSync(path.join(process.cwd(), "content", "blog", `${slug}.md`), "utf8");
  const { fields, body } = parseFrontmatter(source);
  const cover = fields.cover as Post["cover"];
  if (!["blue", "coral", "green"].includes(cover)) throw new Error(`Unsupported cover for ${slug}.`);
  const paragraphs = body.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  if (paragraphs.length === 0) throw new Error(`Blog post ${slug} has no body paragraphs.`);
  return {
    slug,
    title: fields.title,
    excerpt: fields.excerpt,
    date: fields.date,
    cover,
    tags: fields.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    paragraphs
  };
}

export const posts = postSlugs.map(readPost).sort((a, b) => b.date.localeCompare(a.date));

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}
