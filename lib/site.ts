export function publicSiteUrl() {
  const configured = process.env.SITE_URL?.trim();
  if (!configured) return null;
  try {
    const url = new URL(configured);
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
    return url;
  } catch {
    return null;
  }
}

export function absoluteSiteUrl(pathname: string) {
  const siteUrl = publicSiteUrl();
  if (!siteUrl) return null;
  return new URL(pathname.replace(/^\/+/, ""), siteUrl).toString();
}

export function sitePath(pathname: string) {
  if (/^(?:[a-z]+:)?\/\//i.test(pathname)) return pathname;
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "").replace(/\/+$/, "");
  const normalized = pathname === "/" ? "/" : `/${pathname.replace(/^\/+/, "")}`;
  return `${basePath}${normalized}` || "/";
}
