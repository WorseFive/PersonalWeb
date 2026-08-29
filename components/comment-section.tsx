"use client";

import { FormEvent, useState } from "react";
import type { PortalComment } from "@/lib/types";

type Props = { postSlug: string; initialComments: PortalComment[] };

export function CommentSection({ postSlug, initialComments }: Props) {
  const [comments, setComments] = useState(initialComments);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postSlug, authorName: name, body })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Your comment could not be submitted.");
      setName("");
      setBody("");
      setMessage("Received. Your comment is waiting for moderation.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your comment could not be submitted.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="comments" aria-labelledby="comments-title">
      <div className="section-heading">
        <p className="eyebrow">Correspondence</p>
        <h2 id="comments-title">Notes from readers</h2>
      </div>
      {comments.length > 0 ? (
        <ol className="comment-list">
          {comments.map((comment) => (
            <li key={comment.id}>
              <strong>{comment.authorName}</strong>
              <time dateTime={comment.createdAt}>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(comment.createdAt))}</time>
              <p>{comment.body}</p>
            </li>
          ))}
        </ol>
      ) : <p className="muted">No published notes yet. The first one can be yours.</p>}

      <form className="comment-form" onSubmit={submit}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={40} required />
        </label>
        <label>
          Comment
          <textarea value={body} onChange={(event) => setBody(event.target.value)} minLength={2} maxLength={1200} required rows={5} />
        </label>
        <div className="form-row">
          <button className="primary-button" disabled={pending} type="submit">{pending ? "Sending..." : "Send for review"}</button>
          <p aria-live="polite" className="form-message">{message}</p>
        </div>
      </form>
    </section>
  );
}
