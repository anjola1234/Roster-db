"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminCompanyRow } from "@/lib/adminQueries";

export function StatusPill({ status }: { status: string }) {
  const cls =
    status === "active" ? "pill emerald" : status === "pending" ? "pill amber" : "pill";
  return <span className={cls}>{status}</span>;
}

export function VerificationPill({ verification }: { verification: string }) {
  if (verification === "verified") return <span className="pill emerald">✔ verified</span>;
  if (verification === "flagged") return <span className="pill amber">⚑ flagged</span>;
  return <span className="pill">unverified</span>;
}

export default function AdminCompanyTable({ companies }: { companies: AdminCompanyRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function moderate(id: string, action: string) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/companies/${id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "That didn't work.");
      } else {
        // Re-runs the server component so the row reflects the new state.
        router.refresh();
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Permanently delete "${name}"? Its reviews and claims go too. Archiving is reversible; this isn't.`)) {
      return;
    }
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/companies/${id}`, { method: "DELETE" });
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

  if (!companies.length) {
    return <p className="admin-empty">No listings match these filters.</p>;
  }

  return (
    <>
      {error && <p className="form-msg err">{error}</p>}
      <div className="table-wrap">
        <table className="dir">
          <thead>
            <tr>
              <th>Company</th>
              <th>Category</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Reviews</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => {
              const primary = c.regions.find((r) => r.isPrimary)?.region.name;
              const busy = busyId === c.id;
              return (
                <tr key={c.id} className={busy ? "is-busy" : undefined}>
                  <td>
                    <div className="ent">
                      <div className="ent-logo" style={{ background: c.logoColor }}>
                        {c.logoInitials}
                      </div>
                      <div>
                        <div className="ent-name">{c.name}</div>
                        <div className="ent-sub">
                          {primary ?? "no region"} · /{c.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="td-desc">
                    {c.industry.parent?.name ? `${c.industry.parent.name} · ` : ""}
                    {c.industry.name}
                  </td>
                  <td>
                    <StatusPill status={c.status} />
                  </td>
                  <td>
                    <VerificationPill verification={c.verification} />
                  </td>
                  <td className="mono">{c._count.reviews}</td>
                  <td>
                    <div className="admin-row-actions">
                      <Link className="btn btn-ghost btn-xs" href={`/admin/companies/${c.id}`}>
                        Edit
                      </Link>
                      {c.verification === "verified" ? (
                        <button
                          className="btn btn-ghost btn-xs"
                          disabled={busy}
                          onClick={() => moderate(c.id, "unverify")}
                        >
                          Unverify
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost btn-xs"
                          disabled={busy}
                          onClick={() => moderate(c.id, "verify")}
                        >
                          Verify
                        </button>
                      )}
                      {c.status === "archived" ? (
                        <button
                          className="btn btn-ghost btn-xs"
                          disabled={busy}
                          onClick={() => moderate(c.id, "restore")}
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost btn-xs"
                          disabled={busy}
                          onClick={() => moderate(c.id, "archive")}
                        >
                          Archive
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-xs is-danger"
                        disabled={busy}
                        onClick={() => remove(c.id, c.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
