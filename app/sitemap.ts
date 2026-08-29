import type { MetadataRoute } from "next";
import { posts } from "@/lib/content";
import { publicSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = publicSiteUrl();
  if (!siteUrl) return [];
  return ["/", "/about", "/blog", "/library", ...posts.map((post) => `/blog/${post.slug}`)].map((pathname) => ({
    url: new URL(pathname, siteUrl).toString(),
    lastModified: new Date()
  }));
}
