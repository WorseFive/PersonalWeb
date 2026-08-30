import "server-only";

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type PublicResource = {
  id: string;
  title: string;
  description: string;
  sourceName: string;
  type: string;
  size?: string;
  href: string;
};

function parseFrontmatter(source: string) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("Resource content must contain frontmatter.");
  const fields = Object.fromEntries(match[1].split(/\r?\n/).map((line) => {
    const separator = line.indexOf(":");
    if (separator < 0) throw new Error(`Invalid resource frontmatter line: ${line}`);
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      try { return [key, JSON.parse(value) as string]; }
      catch { throw new Error("Invalid quoted resource frontmatter value."); }
    }
    return [key, value];
  }));
  return fields;
}

function readResource(filename: string): PublicResource {
  const source = readFileSync(path.join(process.cwd(), "content", "resources", filename), "utf8");
  const fields = parseFrontmatter(source);
  const id = filename.replace(/\.md$/, "");
  for (const field of ["title", "description", "sourceName", "type", "href"]) {
    if (!fields[field]) throw new Error(`Resource ${id} is missing ${field}.`);
  }
  return {
    id,
    title: fields.title,
    description: fields.description,
    sourceName: fields.sourceName,
    type: fields.type,
    size: fields.size || undefined,
    href: fields.href
  };
}

const resourcesDirectory = path.join(process.cwd(), "content", "resources");
export const resources: PublicResource[] = existsSync(resourcesDirectory)
  ? readdirSync(resourcesDirectory).filter((filename) => filename.endsWith(".md")).map(readResource)
  : [];
