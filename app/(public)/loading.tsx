export default function PublicLoading() {
  return (
    <main className="paper-page route-state" aria-busy="true" aria-live="polite">
      <section className="state-card">
        <p className="eyebrow">Opening the cabinet</p>
        <h1>Turning the page…</h1>
        <p className="muted">The next room is loading.</p>
      </section>
    </main>
  );
}
