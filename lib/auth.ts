import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "personalweb_admin";

type SessionPayload = { role: "admin"; expiresAt: number };

function secret() {
  return process.env.SESSION_SECRET ?? "";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function credentialsConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && secret().length >= 32);
}

export function passwordMatches(candidate: string) {
  const configured = process.env.ADMIN_PASSWORD ?? "";
  if (!configured || candidate.length !== configured.length) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(configured));
}

export function createAdminSession() {
  if (!credentialsConfigured()) return null;
  const payload: SessionPayload = { role: "admin", expiresAt: Date.now() + 1000 * 60 * 60 * 8 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function isValidAdminSession(token: string | undefined) {
  if (!token || !credentialsConfigured()) return false;
  const [encoded, suppliedSignature] = token.split(".");
  if (!encoded || !suppliedSignature) return false;
  const expectedSignature = sign(encoded);
  if (suppliedSignature.length !== expectedSignature.length) return false;
  if (!timingSafeEqual(Buffer.from(suppliedSignature), Buffer.from(expectedSignature))) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    return payload.role === "admin" && Number.isFinite(payload.expiresAt) && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}
