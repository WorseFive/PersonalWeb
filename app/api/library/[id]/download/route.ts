import { NextRequest, NextResponse } from "next/server";
import { findResource, readResourceBytes } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const resource = await findResource(id);
  if (!resource) return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  try {
    const bytes = await readResourceBytes(resource);
    const safeName = resource.sourceName.replace(/["\\\r\n]/g, "_");
    return new NextResponse(new Uint8Array(bytes), { headers: { "Content-Type": resource.mediaType, "Content-Length": String(bytes.byteLength), "Content-Disposition": `attachment; filename="${safeName}"`, "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Resource file is unavailable." }, { status: 500 });
  }
}
