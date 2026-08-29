import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/auth";

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

export function takeCommentAllowance(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const key = forwarded?.split(",")[0]?.trim() || "local";
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
