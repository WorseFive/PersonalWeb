import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { listResources } from "@/lib/store";

export const dynamic = "force-dynamic";

function displaySize(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

export default async function LibraryPage() {
  const resources = await listResources();
  return (
    <main className="library-page">
      <SiteHeader />
      <section className="library-intro">
        <p className="eyebrow">Open library</p>
        <h1>Resources with a proper shelf.</h1>
        <p>Every file is served through a resource record instead of a guessed storage path.</p>
      </section>
      <section className="resource-shelf" aria-label="Downloadable resources">
        {resources.map((resource) => <article className="resource-card" key={resource.id}>
          <span className="resource-type">{resource.mediaType === "text/plain" ? "TXT" : resource.mediaType === "application/pdf" ? "PDF" : "PNG"}</span>
          <h2>{resource.title}</h2><p>{resource.description}</p><small>{resource.sourceName} · {displaySize(resource.size)}</small>
          <Link className="primary-button" href={`/api/library/${resource.id}/download`}>Download</Link>
        </article>)}
      </section>
    </main>
  );
}
