"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminReviewRow } from "@/lib/adminQueries";
import { timeAgo } from "@/lib/format";

export default function AdminReviews({
  reviews,
  status,
}: {
  reviews: AdminReviewRow[];
  status: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function decide(id: string, action: "publish" | "reject" | "unpublish" | "remove") {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "That didn't work.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (!reviews.length) {
    return <p className="admin-empty">No {status} reviews.</p>;
  }

  return (
    <>
      {error && <p className="form-msg err">{error}</p>}
      <div className="admin-queue">
        {reviews.map((r) => {
          const busy = busyId === r.id;
          return (
            <article key={r.id} className="panel admin-queue-item">
              <div className="admin-queue-main">
                <div className="ent-name">
                  <span className="admin-stars" aria-label={`${r.rating} out of 5`}>
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </span>{" "}
                  {r.title}
                </div>
                <p className="admin-review-body">{r.body}</p>
                <dl className="admin-kv">
                  <div>
                    <dt>Company</dt>
                    <dd>
                      <Link href={`/company/${r.company.slug}`}>{r.company.name}</Link>
                    </dd>
                  </div>
                  <div>
                    <dt>Author</dt>
                    <dd>
                      {r.authorName} · {r.authorRole}
                    </dd>
                  </div>
                  <div>
                    <dt>Account</dt>
                    <dd className="mono">{r.user?.email ?? "no account (seeded)"}</dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>{timeAgo(r.createdAt)}</dd>
                  </div>
                </dl>
              </div>

              <div className="admin-queue-actions">
                {status === "published" ? (
                  <>
                    <button
                      className="btn btn-ghost"
                      disabled={busy}
                      onClick={() => decide(r.id, "unpublish")}
                    >
                      Send back to pending
                    </button>
                    <button
                      className="btn btn-ghost is-danger"
                      disabled={busy}
                      onClick={() => decide(r.id, "remove")}
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={() => decide(r.id, "publish")}
                    >
                      Publish
                    </button>
                    <button
                      className="btn btn-ghost is-danger"
                      disabled={busy}
                      onClick={() => decide(r.id, "reject")}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
