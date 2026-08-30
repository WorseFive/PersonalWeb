"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="admin-page route-state">
      <section className="state-card" role="alert">
        <p className="eyebrow">Control room error</p>
        <h1>The console is unavailable.</h1>
        <p className="muted">No administrator action was completed. You can safely retry.</p>
        <button className="primary-button" onClick={() => reset()} type="button">Try again</button>
      </section>
    </main>
  );
}
