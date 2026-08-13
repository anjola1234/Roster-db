"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminClaimRow } from "@/lib/adminQueries";
import { formatDate, timeAgo } from "@/lib/format";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner / founder",
  employee: "Employee",
  agency: "Agency acting for them",
  other: "Other",
};

const PROOF_LABELS: Record<string, string> = {
  work_email: "Work email address",
  dns_txt: "DNS TXT record",
  document: "Uploaded document",
  phone_callback: "Phone callback",
};

/** Does the claimant's email domain match the listed website's domain? */
function domainMatch(email: string, website: string): boolean | null {
  const emailDomain = email.split("@")[1]?.toLowerCase();
  if (!emailDomain) return null;
  try {
    const host = new URL(website).hostname.toLowerCase().replace(/^www\./, "");
    return host === emailDomain || host.endsWith(`.${emailDomain}`) || emailDomain.endsWith(`.${host}`);
  } catch {
    return null;
  }
}

export default function AdminClaims({ claims }: { claims: AdminClaimRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function decide(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/claims/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: notes[id] ?? "" }),
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

  if (!claims.length) {
    return (
      <p className="admin-empty">
        No claims waiting. These appear when a signed-in user says they represent a listed company.
      </p>
    );
  }

  return (
    <>
      {error && <p className="form-msg err">{error}</p>}
      <div className="admin-queue">
        {claims.map((c) => {
          const busy = busyId === c.id;
          const match = domainMatch(c.user.email, c.company.website);
          return (
            <article key={c.id} className="panel admin-queue-item">
              <div className="admin-queue-main">
                <div className="ent-name">
                  {c.user.name} <span className="admin-muted">claims</span> {c.company.name}
                </div>

                <dl className="admin-kv">
                  <div>
                    <dt>Claimant</dt>
                    <dd className="mono">{c.user.email}</dd>
                  </div>
                  <div>
                    <dt>Stated role</dt>
                    <dd>{ROLE_LABELS[c.claimedRole] ?? c.claimedRole}</dd>
                  </div>
                  <div>
                    <dt>Offered proof</dt>
                    <dd>{PROOF_LABELS[c.proofMethod] ?? c.proofMethod}</dd>
                  </div>
                  <div>
                    <dt>Listed website</dt>
                    <dd>
                      <a href={c.company.website} target="_blank" rel="noopener noreferrer">
                        {c.company.website} ↗
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt>Account created</dt>
                    <dd>{formatDate(c.user.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Waiting</dt>
                    <dd>{timeAgo(c.createdAt)}</dd>
                  </div>
                </dl>

                <p className={match ? "admin-signal is-good" : "admin-signal is-warn"}>
                  {match === true
                    ? "Email domain matches the listed website."
                    : match === false
                      ? "Email domain does not match the listed website."
                      : "Couldn't compare the email domain to the website."}
                </p>
                <p className="admin-note">
                  This is a hint, not proof — a matching domain can be spoofed in the display name
                  and a mismatch is normal for agencies or people using a personal address. Confirm
                  the person independently before approving; approving marks the whole listing
                  verified.
                </p>

                <div className="field">
                  <label htmlFor={`note-${c.id}`}>Decision note (stored with the badge)</label>
                  <input
                    id={`note-${c.id}`}
                    value={notes[c.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
                    placeholder="e.g. Confirmed by phone with the number on their site, 12 Aug"
                    maxLength={500}
                  />
                </div>
              </div>

              <div className="admin-queue-actions">
                <Link className="btn btn-ghost" href={`/company/${c.company.slug}`}>
                  View listing ↗
                </Link>
                <button className="btn btn-primary" disabled={busy} onClick={() => decide(c.id, "approve")}>
                  Approve claim
                </button>
                <button
                  className="btn btn-ghost is-danger"
                  disabled={busy}
                  onClick={() => decide(c.id, "reject")}
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
