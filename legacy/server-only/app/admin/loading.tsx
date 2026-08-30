export default function AdminLoading() {
  return (
    <main className="admin-page route-state" aria-busy="true" aria-live="polite">
      <section className="state-card">
        <p className="eyebrow">Control room</p>
        <h1>Checking the door…</h1>
        <p className="muted">Preparing the administrator boundary.</p>
      </section>
    </main>
  );
}
