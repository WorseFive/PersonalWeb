import { NextRequest, NextResponse } from "next/server";
import { listPendingComments } from "@/lib/store";
import { isAdmin } from "@/lib/request-security";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Administrator session required." }, { status: 401 });
  return NextResponse.json({ comments: await listPendingComments() });
}
