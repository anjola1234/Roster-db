"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminCompanyRow } from "@/lib/adminQueries";
import { timeAgo } from "@/lib/format";

export default function AdminSubmissions({ submissions }: { submissions: AdminCompanyRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function decide(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/companies/${id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reasons[id] ?? "" }),
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

  if (!submissions.length) {
    return (
      <p className="admin-empty">
        No submissions waiting. Anything the public submits through{" "}
        <Link href="/list-your-product">List your product</Link> lands here.
      </p>
    );
  }

  return (
    <>
      {error && <p className="form-msg err">{error}</p>}
      <div className="admin-queue">
        {submissions.map((s) => {
          const busy = busyId === s.id;
          const primary = s.regions.find((r) => r.isPrimary)?.region.name;
          return (
            <article key={s.id} className="panel admin-queue-item">
              <div className="admin-queue-main">
                <div className="ent">
                  <div className="ent-logo" style={{ background: s.logoColor }}>
                    {s.logoInitials}
                  </div>
                  <div>
                    <div className="ent-name">{s.name}</div>
                    <div className="ent-sub">
                      {s.industry.parent?.name ? `${s.industry.parent.name} · ` : ""}
                      {s.industry.name}
                      {primary ? ` · ${primary}` : ""}
                    </div>
                  </div>
                </div>

                <dl className="admin-kv">
                  <div>
                    <dt>Website</dt>
                    <dd>
                      <a href={s.website} target="_blank" rel="noopener noreferrer">
                        {s.website} ↗
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt>Submitted by</dt>
                    <dd>{s.submittedByEmail ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Waiting</dt>
                    <dd>{timeAgo(s.createdAt)}</dd>
                  </div>
                </dl>
                <p className="admin-note">
                  Check the website loads and describes the same company before approving —
                  approving publishes it and marks it verified.
                </p>
              </div>

              <div className="admin-queue-actions">
                <div className="field">
                  <label htmlFor={`reason-${s.id}`}>Reason (recorded in the audit log)</label>
                  <input
                    id={`reason-${s.id}`}
                    value={reasons[s.id] ?? ""}
                    onChange={(e) => setReasons((r) => ({ ...r, [s.id]: e.target.value }))}
                    placeholder="e.g. Website and CAC record both confirm"
                    maxLength={1000}
                  />
                </div>
                <Link className="btn btn-ghost" href={`/admin/companies/${s.id}`}>
                  Open full form
                </Link>
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => decide(s.id, "approve")}
                >
                  Approve &amp; publish
                </button>
                <button
                  className="btn btn-ghost is-danger"
                  disabled={busy}
                  onClick={() => decide(s.id, "reject")}
                >
                  Reject
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
