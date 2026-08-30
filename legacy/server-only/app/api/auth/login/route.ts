import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, credentialsConfigured, passwordMatches } from "@/lib/auth";
import { sameOrigin } from "@/lib/request-security";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin sign-in requests are not accepted." }, { status: 403 });
  if (!credentialsConfigured()) return NextResponse.json({ error: "Administrator credentials are not configured." }, { status: 503 });
  let candidate = "";
  try { candidate = String((await request.json() as { password?: unknown }).password ?? ""); } catch { return NextResponse.json({ error: "Invalid sign-in request." }, { status: 400 }); }
  if (!passwordMatches(candidate)) return NextResponse.json({ error: "Invalid administrator password." }, { status: 401 });
  const session = createAdminSession();
  if (!session) return NextResponse.json({ error: "Administrator session could not be created." }, { status: 503 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: ADMIN_COOKIE, value: session, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 });
  return response;
}
