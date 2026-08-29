export function publicSiteUrl() {
  const configured = process.env.SITE_URL?.trim();
  const preview = process.env.VERCEL_URL?.trim();
  const candidate = configured || (preview ? `https://${preview}` : "");
  if (!candidate) return null;
  try { return new URL(candidate); } catch { return null; }
}
