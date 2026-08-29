import { SiteHeader } from "@/components/site-header";

export default function AboutPage() {
  return (
    <main className="paper-page">
      <SiteHeader />
      <article className="reading-column about-copy">
        <p className="eyebrow">About</p>
        <h1>A small public working room</h1>
        <p>This portal collects writing, reference material, and carefully shared work. Its visual language borrows the Wii menu&apos;s calm clarity and the early iBooks shelf&apos;s sense of a kept collection.</p>
        <p>Reading is public, comments wait for review, and library uploads require an administrator session. In production, comments and resource metadata live in a managed Postgres database, while the files remain in private object storage behind checked download routes.</p>
      </article>
    </main>
  );
}
