import { NextRequest, NextResponse } from "next/server";
import { deleteResource } from "@/lib/store";
import { isAdmin, sameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin deletion requests are not accepted." }, { status: 403 });
  if (!isAdmin(request)) return NextResponse.json({ error: "Administrator session required." }, { status: 401 });
  const { id } = await context.params;
  const resource = await deleteResource(id);
  if (!resource) return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  return NextResponse.json({ resource });
}
