import { SiteHeader } from "@/components/site-header";
import { resources } from "@/lib/resources";
import { sitePath } from "@/lib/site";

export default function LibraryPage() {
  return (
    <main className="library-page">
      <SiteHeader />
      <section className="library-intro">
        <p className="eyebrow">Open library</p>
        <h1>Resources with a proper shelf.</h1>
        <p>Approved public resources are published as ordinary Git-tracked links or files.</p>
      </section>
      <section className="resource-shelf" aria-label="Downloadable resources">
        {resources.length === 0 ? <p className="empty-state">The shelf is empty for now. Published resources will appear here.</p> : resources.map((resource) => <article className="resource-card" key={resource.id}>
          <span className="resource-type">{resource.type}</span>
          <h2>{resource.title}</h2><p>{resource.description}</p><small>{resource.sourceName}{resource.size ? ` · ${resource.size}` : ""}</small>
          <a className="primary-button" href={sitePath(resource.href)}>Open resource</a>
        </article>)}
      </section>
    </main>
  );
}
