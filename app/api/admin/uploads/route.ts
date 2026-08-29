import { NextRequest, NextResponse } from "next/server";
import { createResource } from "@/lib/store";
import { isAdmin, sameOrigin } from "@/lib/request-security";
import { validateMagicBytes, validateUploadMetadata } from "@/lib/validation";

export const runtime = "nodejs";

function cleanField(value: FormDataEntryValue | null, maximum: number) {
  const text = typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim() : "";
  return text.length >= 2 && text.length <= maximum ? text : null;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin upload requests are not accepted." }, { status: 403 });
  if (!isAdmin(request)) return NextResponse.json({ error: "Administrator session required." }, { status: 401 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Invalid upload request." }, { status: 400 }); }
  const title = cleanField(form.get("title"), 100);
  const description = cleanField(form.get("description"), 280);
  const file = form.get("file");
  if (!title || !description || !(file instanceof File)) return NextResponse.json({ error: "Title, description, and file are required." }, { status: 400 });
  const metadata = validateUploadMetadata(file.name, file.type, file.size);
  if (!metadata.ok) return NextResponse.json({ error: metadata.error }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validateMagicBytes(metadata.mediaType, bytes)) return NextResponse.json({ error: "The file contents do not match the claimed type." }, { status: 400 });
  const resource = await createResource({ title, description, sourceName: file.name, mediaType: metadata.mediaType, bytes });
  return NextResponse.json({ resource }, { status: 201 });
}
