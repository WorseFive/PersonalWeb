import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { CommentStatus, PortalComment, PortalDatabase, StoredResource } from "@/lib/types";

function dataDirectory() {
  return process.env.PORTAL_DATA_DIR || path.join(process.cwd(), ".data");
}

function uploadsDirectory() {
  return path.join(dataDirectory(), "uploads");
}

function databasePath() {
  return path.join(dataDirectory(), "portal.json");
}

async function ensureDatabase() {
  await mkdir(uploadsDirectory(), { recursive: true });
  try {
    await readFile(databasePath(), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const seedId = "welcome-notes";
    const seedKey = `${seedId}.txt`;
    const seedText = "Welcome to the PersonalWeb local library.\n";
    await writeFile(path.join(uploadsDirectory(), seedKey), seedText, "utf8");
    const database: PortalDatabase = {
      version: 1,
      comments: [],
      resources: [{
        id: seedId,
        title: "Welcome note",
        description: "A local text resource proving that downloads run through the server boundary.",
        sourceName: "welcome.txt",
        storageKey: seedKey,
        mediaType: "text/plain",
        size: Buffer.byteLength(seedText),
        createdAt: new Date().toISOString(),
        visibility: "public"
      }]
    };
    await writeFile(databasePath(), JSON.stringify(database, null, 2), "utf8");
  }
}

async function readDatabase() {
  await ensureDatabase();
  return JSON.parse(await readFile(databasePath(), "utf8")) as PortalDatabase;
}

async function saveDatabase(database: PortalDatabase) {
  await writeFile(databasePath(), JSON.stringify(database, null, 2), "utf8");
}

export async function listResources() {
  const database = await readDatabase();
  return database.resources.filter((resource) => resource.visibility === "public").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findResource(id: string) {
  const database = await readDatabase();
  return database.resources.find((resource) => resource.id === id && resource.visibility === "public") ?? null;
}

export async function readResourceBytes(resource: StoredResource) {
  const safePath = path.resolve(uploadsDirectory(), resource.storageKey);
  const root = `${path.resolve(uploadsDirectory())}${path.sep}`;
  if (!safePath.startsWith(root)) throw new Error("Invalid storage key.");
  return readFile(safePath);
}

export async function listPublishedComments(postSlug: string) {
  const database = await readDatabase();
  return database.comments.filter((comment) => comment.postSlug === postSlug && comment.status === "published").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createComment(input: Omit<PortalComment, "id" | "status" | "createdAt">) {
  const database = await readDatabase();
  const comment: PortalComment = { ...input, id: randomUUID(), status: "pending", createdAt: new Date().toISOString() };
  database.comments.push(comment);
  await saveDatabase(database);
  return comment;
}

export async function listPendingComments() {
  const database = await readDatabase();
  return database.comments.filter((comment) => comment.status === "pending").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function moderateComment(id: string, status: Extract<CommentStatus, "published" | "rejected">) {
  const database = await readDatabase();
  const comment = database.comments.find((item) => item.id === id);
  if (!comment) return null;
  comment.status = status;
  comment.moderatedAt = new Date().toISOString();
  await saveDatabase(database);
  return comment;
}

export async function createResource(input: { title: string; description: string; sourceName: string; mediaType: StoredResource["mediaType"]; bytes: Uint8Array }) {
  const database = await readDatabase();
  const extension = path.extname(input.sourceName).toLowerCase();
  const id = randomUUID();
  const storageKey = `${id}${extension}`;
  const resource: StoredResource = {
    id,
    title: input.title,
    description: input.description,
    sourceName: input.sourceName,
    storageKey,
    mediaType: input.mediaType,
    size: input.bytes.byteLength,
    createdAt: new Date().toISOString(),
    visibility: "public"
  };
  await writeFile(path.join(uploadsDirectory(), storageKey), input.bytes, { flag: "wx" });
  database.resources.push(resource);
  await saveDatabase(database);
  return resource;
}
