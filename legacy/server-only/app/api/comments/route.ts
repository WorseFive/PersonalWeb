import { NextRequest, NextResponse } from "next/server";
import { getPost } from "@/lib/content";
import { listPublishedComments, createComment } from "@/lib/store";
import { sameOrigin, takeCommentAllowance } from "@/lib/request-security";
import { validateCommentInput } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const postSlug = request.nextUrl.searchParams.get("post") ?? "";
  if (!getPost(postSlug)) return NextResponse.json({ error: "Article not found." }, { status: 404 });
  return NextResponse.json({ comments: await listPublishedComments(postSlug) });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin comment requests are not accepted." }, { status: 403 });
  if (!(await takeCommentAllowance(request))) return NextResponse.json({ error: "Please wait before submitting another comment." }, { status: 429 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
  const parsed = validateCommentInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!getPost(parsed.value.postSlug)) return NextResponse.json({ error: "Article not found." }, { status: 404 });
  const comment = await createComment(parsed.value);
  return NextResponse.json({ comment }, { status: 201 });
}
