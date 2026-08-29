import type { NextRequest } from "next/server";
import { createHmac } from "node:crypto";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/auth";
import { dataProvider, supabaseAdmin } from "@/lib/supabase";

const attempts = new Map<string, { count: number; resetsAt: number }>();

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;
  try { return new URL(origin).host === host; } catch { return false; }
}

export function isAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
}

function rateLimitKey(request: Request) {
  const forwarded = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for");
  const address = forwarded?.split(",")[0]?.trim() || "local";
  const secret = process.env.RATE_LIMIT_SECRET ?? process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("RATE_LIMIT_SECRET (or SESSION_SECRET) must be at least 32 characters.");
  return createHmac("sha256", secret).update(address).digest("hex");
}

export async function takeCommentAllowance(request: Request) {
  const key = rateLimitKey(request);
  if (dataProvider() === "supabase") {
    const { data, error } = await supabaseAdmin().rpc("take_comment_allowance", { p_request_hash: key });
    if (error) throw new Error(`Could not enforce comment rate limit: ${error.message}`);
    return data === true;
  }
  const now = Date.now();
  const state = attempts.get(key);
  if (!state || state.resetsAt < now) {
    attempts.set(key, { count: 1, resetsAt: now + 60_000 });
    return true;
  }
  if (state.count >= 3) return false;
  state.count += 1;
  return true;
}
