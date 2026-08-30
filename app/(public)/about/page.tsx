import { SiteHeader } from "@/components/site-header";

export default function AboutPage() {
  return (
    <main className="paper-page">
      <SiteHeader />
      <article className="reading-column about-copy">
        <p className="eyebrow">About</p>
        <h1>A small public working room</h1>
        <p>This portal collects writing, reference material, and carefully shared work. Its visual language borrows the Wii menu&apos;s calm clarity and the early iBooks shelf&apos;s sense of a kept collection.</p>
        <p>The first release is a public, static site. Articles and approved resources are updated through Git commits and published by GitHub Actions to GitHub Pages.</p>
        <p>Personal profile details and external links will appear here only after the owner supplies and approves the exact public wording.</p>
      </article>
    </main>
  );
}
