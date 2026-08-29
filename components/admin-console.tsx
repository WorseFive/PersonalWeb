"use client";

import { FormEvent, useEffect, useState } from "react";
import type { PortalComment, StoredResource } from "@/lib/types";

type ApiError = { error?: string };

export function AdminConsole() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [comments, setComments] = useState<PortalComment[]>([]);
  const [message, setMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  async function loadComments() {
    const response = await fetch("/api/admin/comments", { credentials: "same-origin" });
    if (!response.ok) {
      setAuthenticated(false);
      return;
    }
    const result = await response.json() as { comments: PortalComment[] };
    setAuthenticated(true);
    setComments(result.comments);
  }

  useEffect(() => { void loadComments(); }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ password })
    });
    const result = await response.json() as ApiError;
    if (!response.ok) {
      setMessage(result.error ?? "Sign-in failed.");
      return;
    }
    setPassword("");
    setMessage("Local administrator session active.");
    await loadComments();
  }

  async function moderate(id: string, status: "published" | "rejected") {
    const response = await fetch(`/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status })
    });
    const result = await response.json() as ApiError;
    if (!response.ok) {
      setMessage(result.error ?? "Moderation failed.");
      return;
    }
    setComments((current) => current.filter((comment) => comment.id !== id));
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setUploadMessage("");
    const response = await fetch("/api/admin/uploads", { method: "POST", credentials: "same-origin", body: new FormData(form) });
    const result = await response.json() as ApiError & { resource?: StoredResource };
    if (!response.ok) {
      setUploadMessage(result.error ?? "Upload failed.");
      return;
    }
    form.reset();
    setUploadMessage(`Saved ${result.resource?.title ?? "resource"} to the public library.`);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    setAuthenticated(false);
    setComments([]);
    setMessage("Signed out.");
  }

  if (!authenticated) {
    return (
      <section className="admin-panel" aria-labelledby="admin-title">
        <p className="eyebrow">Local-only control room</p>
        <h1 id="admin-title">Administrator sign-in</h1>
        <p className="muted">Set `ADMIN_PASSWORD` and a 32-character `SESSION_SECRET` in `.env.local` before using this local adapter.</p>
        <form className="login-form" onSubmit={login}>
          <label>
            Local administrator password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
          </label>
          <button className="primary-button" type="submit">Sign in locally</button>
        </form>
        <p aria-live="polite" className="form-message">{message}</p>
      </section>
    );
  }

  return (
    <section className="admin-panel" aria-labelledby="admin-title">
      <div className="admin-title-row">
        <div>
          <p className="eyebrow">Local-only control room</p>
          <h1 id="admin-title">Moderate and publish</h1>
        </div>
        <button className="quiet-button" onClick={logout} type="button">Sign out</button>
      </div>
      <p aria-live="polite" className="form-message">{message}</p>
      <div className="admin-grid">
        <section>
          <h2>Pending comments</h2>
          {comments.length === 0 ? <p className="muted">Nothing is waiting for review.</p> : (
            <ul className="moderation-list">
              {comments.map((comment) => <li key={comment.id}>
                <strong>{comment.authorName}</strong><span>on {comment.postSlug}</span><p>{comment.body}</p>
                <div><button className="primary-button" onClick={() => void moderate(comment.id, "published")} type="button">Publish</button><button className="danger-button" onClick={() => void moderate(comment.id, "rejected")} type="button">Reject</button></div>
              </li>)}
            </ul>
          )}
        </section>
        <section id="uploads">
          <h2>Add a library resource</h2>
          <form className="upload-form" onSubmit={upload}>
            <label>Title<input name="title" minLength={2} maxLength={100} required /></label>
            <label>Description<textarea name="description" minLength={2} maxLength={280} rows={4} required /></label>
            <label>File (TXT, PDF, or PNG; 5 MB maximum)<input name="file" type="file" accept=".txt,.pdf,.png,text/plain,application/pdf,image/png" required /></label>
            <button className="primary-button" type="submit">Publish to library</button>
          </form>
          <p aria-live="polite" className="form-message">{uploadMessage}</p>
        </section>
      </div>
    </section>
  );
}
