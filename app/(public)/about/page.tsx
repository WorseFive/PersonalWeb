import { SiteHeader } from "@/components/site-header";

export default function AboutPage() {
  return (
    <main className="paper-page">
      <SiteHeader />
      <article className="reading-column about-copy">
        <p className="eyebrow">About</p>
        <h1>A small public working room</h1>
        <p>This portal collects writing, reference material, and carefully shared work. Its visual language borrows the Wii menu&apos;s calm clarity and the early iBooks shelf&apos;s sense of a kept collection.</p>
        <p>The first release has a deliberately narrow boundary: reading is public, comments wait for review, and library uploads require the local administrator session. A managed production provider can replace that local boundary when the site is ready to leave this machine.</p>
      </article>
    </main>
  );
}
