"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewForm({ companySlug }: { companySlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companySlug, authorName, authorRole, rating, title, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      setDone(true);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setOpen(true)}>
        Write review
      </button>
    );
  }

  if (done) {
    return <p className="form-msg ok" style={{ marginTop: 16 }}>Thanks — your review has been posted.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="panel" style={{ marginTop: 16 }}>
      <div className="form-row">
        <div className="field">
          <label htmlFor="authorName">Your name</label>
          <input id="authorName" required maxLength={100} value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="authorRole">Role / context</label>
          <input id="authorRole" required maxLength={150} placeholder="e.g. Customer, Patient" value={authorRole} onChange={(e) => setAuthorRole(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="rating">Rating</label>
        <select id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input id="title" required maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="body">Review</label>
        <textarea id="body" required minLength={10} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      {error && <p className="form-msg err">{error}</p>}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Posting…" : "Post review"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
