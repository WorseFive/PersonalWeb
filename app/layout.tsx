import type { Metadata } from "next";
import "./globals.css";
import { publicSiteUrl } from "@/lib/site";

const siteUrl = publicSiteUrl();

export const metadata: Metadata = {
  title: "WorseFive's Cabinet",
  description: "A personal portal for writing, working notes, and carefully shared resources.",
  ...(siteUrl ? { metadataBase: siteUrl } : {}),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "WorseFive's Cabinet",
    description: "Writing, working notes, and carefully shared resources."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
