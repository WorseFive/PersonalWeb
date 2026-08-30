"use client";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="paper-page route-state">
      <section className="state-card" role="alert">
        <p className="eyebrow">A page-turning error</p>
        <h1>This room needs another try.</h1>
        <p className="muted">The page could not be prepared right now.</p>
        <button className="primary-button" onClick={() => reset()} type="button">Try again</button>
      </section>
    </main>
  );
}
