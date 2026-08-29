import "server-only";

import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { CommentStatus, PortalComment, PortalDatabase, StoredResource } from "@/lib/types";
import { dataProvider, storageBucket, supabaseAdmin } from "@/lib/supabase";

type ResourceInput = { title: string; description: string; sourceName: string; mediaType: StoredResource["mediaType"]; bytes: Uint8Array };

function dataDirectory() {
  return process.env.PORTAL_DATA_DIR || path.join(process.cwd(), ".data");
}

function uploadsDirectory() {
  return path.join(dataDirectory(), "uploads");
}

function databasePath() {
  return path.join(dataDirectory(), "portal.json");
}

async function ensureLocalDatabase() {
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

async function readLocalDatabase() {
  await ensureLocalDatabase();
  return JSON.parse(await readFile(databasePath(), "utf8")) as PortalDatabase;
}

async function saveLocalDatabase(database: PortalDatabase) {
  await writeFile(databasePath(), JSON.stringify(database, null, 2), "utf8");
}

function toComment(row: Record<string, unknown>): PortalComment {
  return {
    id: String(row.id),
    postSlug: String(row.post_slug),
    authorName: String(row.author_name),
    body: String(row.body),
    status: row.status as CommentStatus,
    createdAt: String(row.created_at),
    ...(row.moderated_at ? { moderatedAt: String(row.moderated_at) } : {})
  };
}

function toResource(row: Record<string, unknown>): StoredResource {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    sourceName: String(row.source_name),
    storageKey: String(row.storage_key),
    mediaType: row.media_type as StoredResource["mediaType"],
    size: Number(row.size),
    createdAt: String(row.created_at),
    visibility: "public"
  };
}

function expectData<T>(data: T | null, error: { message: string } | null, label: string): T {
  if (error || data === null) throw new Error(`${label}: ${error?.message ?? "no data returned"}`);
  return data;
}

export async function listResources() {
  if (dataProvider() === "local-file") {
    const database = await readLocalDatabase();
    return database.resources.filter((resource) => resource.visibility === "public").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { data, error } = await supabaseAdmin().from("resources").select("*").eq("visibility", "public").order("created_at", { ascending: false });
  if (error) throw new Error(`Could not list resources: ${error.message}`);
  return (data ?? []).map((row) => toResource(row));
}

export async function listAdminResources() {
  if (dataProvider() === "local-file") {
    const database = await readLocalDatabase();
    return [...database.resources].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { data, error } = await supabaseAdmin().from("resources").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Could not list administrator resources: ${error.message}`);
  return (data ?? []).map((row) => toResource(row));
}

export async function findResource(id: string) {
  if (dataProvider() === "local-file") {
    const database = await readLocalDatabase();
    return database.resources.find((resource) => resource.id === id && resource.visibility === "public") ?? null;
  }
  const { data, error } = await supabaseAdmin().from("resources").select("*").eq("id", id).eq("visibility", "public").maybeSingle();
  if (error) throw new Error(`Could not find resource: ${error.message}`);
  return data ? toResource(data) : null;
}

export async function readResourceBytes(resource: StoredResource) {
  if (dataProvider() === "local-file") {
    const safePath = path.resolve(uploadsDirectory(), resource.storageKey);
    const root = `${path.resolve(uploadsDirectory())}${path.sep}`;
    if (!safePath.startsWith(root)) throw new Error("Invalid storage key.");
    return readFile(safePath);
  }
  const { data, error } = await supabaseAdmin().storage.from(storageBucket()).download(resource.storageKey);
  if (error) throw new Error(`Could not read resource bytes: ${error.message}`);
  return new Uint8Array(await data.arrayBuffer());
}

export async function listPublishedComments(postSlug: string) {
  if (dataProvider() === "local-file") {
    const database = await readLocalDatabase();
    return database.comments.filter((comment) => comment.postSlug === postSlug && comment.status === "published").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  const { data, error } = await supabaseAdmin().from("comments").select("*").eq("post_slug", postSlug).eq("status", "published").order("created_at", { ascending: true });
  if (error) throw new Error(`Could not list comments: ${error.message}`);
  return (data ?? []).map((row) => toComment(row));
}

export async function createComment(input: Omit<PortalComment, "id" | "status" | "createdAt">) {
  if (dataProvider() === "local-file") {
    const database = await readLocalDatabase();
    const comment: PortalComment = { ...input, id: randomUUID(), status: "pending", createdAt: new Date().toISOString() };
    database.comments.push(comment);
    await saveLocalDatabase(database);
    return comment;
  }
  const { data, error } = await supabaseAdmin().from("comments").insert({ post_slug: input.postSlug, author_name: input.authorName, body: input.body, status: "pending" }).select("*").single();
  return toComment(expectData(data, error, "Could not create comment"));
}

export async function listPendingComments() {
  if (dataProvider() === "local-file") {
    const database = await readLocalDatabase();
    return database.comments.filter((comment) => comment.status === "pending").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  const { data, error } = await supabaseAdmin().from("comments").select("*").eq("status", "pending").order("created_at", { ascending: true });
  if (error) throw new Error(`Could not list pending comments: ${error.message}`);
  return (data ?? []).map((row) => toComment(row));
}

export async function moderateComment(id: string, status: Extract<CommentStatus, "published" | "rejected">) {
  if (dataProvider() === "local-file") {
    const database = await readLocalDatabase();
    const comment = database.comments.find((item) => item.id === id);
    if (!comment) return null;
    comment.status = status;
    comment.moderatedAt = new Date().toISOString();
    await saveLocalDatabase(database);
    return comment;
  }
  const admin = supabaseAdmin();
  const { data, error } = await admin.from("comments").update({ status, moderated_at: new Date().toISOString(), moderated_by: "portal-administrator" }).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(`Could not moderate comment: ${error.message}`);
  if (!data) return null;
  const { error: auditError } = await admin.from("comment_moderation_events").insert({ comment_id: id, action: status, actor: "portal-administrator" });
  if (auditError) throw new Error(`Could not record moderation event: ${auditError.message}`);
  return toComment(data);
}

export async function createResource(input: ResourceInput) {
  const extension = path.extname(input.sourceName).toLowerCase();
  const id = randomUUID();
  const storageKey = `${id}${extension}`;
  if (dataProvider() === "local-file") {
    const database = await readLocalDatabase();
    const resource: StoredResource = { id, title: input.title, description: input.description, sourceName: input.sourceName, storageKey, mediaType: input.mediaType, size: input.bytes.byteLength, createdAt: new Date().toISOString(), visibility: "public" };
    await writeFile(path.join(uploadsDirectory(), storageKey), input.bytes, { flag: "wx" });
    database.resources.push(resource);
    await saveLocalDatabase(database);
    return resource;
  }
  const admin = supabaseAdmin();
  const { error: uploadError } = await admin.storage.from(storageBucket()).upload(storageKey, input.bytes, { contentType: input.mediaType, upsert: false });
  if (uploadError) throw new Error(`Could not store resource: ${uploadError.message}`);
  const { data, error } = await admin.from("resources").insert({ id, title: input.title, description: input.description, source_name: input.sourceName, storage_key: storageKey, media_type: input.mediaType, size: input.bytes.byteLength, visibility: "public", uploaded_by: "portal-administrator" }).select("*").single();
  if (error || !data) {
    await admin.storage.from(storageBucket()).remove([storageKey]);
    throw new Error(`Could not record resource: ${error?.message ?? "no data returned"}`);
  }
  return toResource(data);
}

export async function deleteResource(id: string) {
  if (dataProvider() === "local-file") {
    const database = await readLocalDatabase();
    const resource = database.resources.find((item) => item.id === id);
    if (!resource) return null;
    const safePath = path.resolve(uploadsDirectory(), resource.storageKey);
    const root = `${path.resolve(uploadsDirectory())}${path.sep}`;
    if (!safePath.startsWith(root)) throw new Error("Invalid storage key.");
    try { await unlink(safePath); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    database.resources = database.resources.filter((item) => item.id !== id);
    await saveLocalDatabase(database);
    return resource;
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin.from("resources").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not find resource for removal: ${error.message}`);
  if (!data) return null;
  const resource = toResource(data);
  const { error: storageError } = await admin.storage.from(storageBucket()).remove([resource.storageKey]);
  if (storageError) throw new Error(`Could not remove resource bytes: ${storageError.message}`);
  const { error: deleteError } = await admin.from("resources").delete().eq("id", id);
  if (deleteError) throw new Error(`Could not remove resource record: ${deleteError.message}`);
  return resource;
}
