import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorseFive's Cabinet",
  description: "A personal portal for writing, working notes, and carefully shared resources."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
