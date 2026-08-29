import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = publicSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    ...(siteUrl ? { sitemap: new URL("/sitemap.xml", siteUrl).toString() } : {})
  };
}
