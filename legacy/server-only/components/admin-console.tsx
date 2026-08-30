"use client";

import { FormEvent, useEffect, useState } from "react";
import type { PortalComment, StoredResource } from "@/lib/types";

type ApiError = { error?: string };

export function AdminConsole() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [comments, setComments] = useState<PortalComment[]>([]);
  const [resources, setResources] = useState<StoredResource[]>([]);
  const [message, setMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  async function loadAdminData() {
    const [commentsResponse, resourcesResponse] = await Promise.all([
      fetch("/api/admin/comments", { credentials: "same-origin" }),
      fetch("/api/admin/resources", { credentials: "same-origin" })
    ]);
    if (!commentsResponse.ok || !resourcesResponse.ok) {
      setAuthenticated(false);
      return;
    }
    const [commentResult, resourceResult] = await Promise.all([
      commentsResponse.json() as Promise<{ comments: PortalComment[] }>,
      resourcesResponse.json() as Promise<{ resources: StoredResource[] }>
    ]);
    setAuthenticated(true);
    setComments(commentResult.comments);
    setResources(resourceResult.resources);
  }

  useEffect(() => { void loadAdminData(); }, []);

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
    setMessage("Administrator session active.");
    await loadAdminData();
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
    await loadAdminData();
  }

  async function removeResource(id: string) {
    const response = await fetch(`/api/admin/resources/${id}`, { method: "DELETE", credentials: "same-origin" });
    const result = await response.json() as ApiError;
    if (!response.ok) {
      setUploadMessage(result.error ?? "Removal failed.");
      return;
    }
    setResources((current) => current.filter((resource) => resource.id !== id));
    setUploadMessage("Resource removed from the library and object storage.");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    setAuthenticated(false);
    setComments([]);
    setResources([]);
    setMessage("Signed out.");
  }

  if (!authenticated) {
    return (
      <section className="admin-panel" aria-labelledby="admin-title">
        <p className="eyebrow">Control room</p>
        <h1 id="admin-title">Administrator sign-in</h1>
        <p className="muted">Use the server-side administrator password configured for this deployment.</p>
        <form className="login-form" onSubmit={login}>
          <label>
            Administrator password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
          </label>
          <button className="primary-button" type="submit">Sign in</button>
        </form>
        <p aria-live="polite" className="form-message">{message}</p>
      </section>
    );
  }

  return (
    <section className="admin-panel" aria-labelledby="admin-title">
      <div className="admin-title-row">
        <div>
          <p className="eyebrow">Control room</p>
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
        <section>
          <h2>Published resources</h2>
          {resources.length === 0 ? <p className="muted">No resources have been published.</p> : (
            <ul className="moderation-list">
              {resources.map((resource) => <li key={resource.id}>
                <strong>{resource.title}</strong><span>{resource.sourceName} · {(resource.size / 1024).toFixed(1)} KB</span><p>{resource.description}</p>
                <button className="danger-button" onClick={() => void removeResource(resource.id)} type="button">Remove file</button>
              </li>)}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
