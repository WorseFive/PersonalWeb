import { NextRequest, NextResponse } from "next/server";
import { moderateComment } from "@/lib/store";
import { isAdmin, sameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin moderation requests are not accepted." }, { status: 403 });
  if (!isAdmin(request)) return NextResponse.json({ error: "Administrator session required." }, { status: 401 });
  let status: unknown;
  try { status = (await request.json() as { status?: unknown }).status; } catch { return NextResponse.json({ error: "Invalid moderation request." }, { status: 400 }); }
  if (status !== "published" && status !== "rejected") return NextResponse.json({ error: "Invalid moderation status." }, { status: 400 });
  const { id } = await context.params;
  const comment = await moderateComment(id, status);
  if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  return NextResponse.json({ comment });
}
