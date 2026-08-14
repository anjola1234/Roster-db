"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ActivityBadge from "@/components/ActivityBadge";
import { timeAgo } from "@/lib/format";

export type ActivityRow = {
  id: string;
  slug: string;
  name: string;
  website: string;
  lifecycleStatus: string;
  activityScore: number | null;
  activityLabel: string | null;
  websiteStatus: string | null;
  websiteLastCheckedAt: Date | null;
  _count: { websiteChecks: number };
};

const STATUS_META: Record<string, { cls: string; label: string }> = {
  reachable: { cls: "pill emerald", label: "reachable" },
  parked: { cls: "pill amber", label: "parked domain" },
  unreachable: { cls: "pill amber", label: "unreachable" },
  error: { cls: "pill amber", label: "network error" },
};

export default function AdminActivity({ companies }: { companies: ActivityRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run(companyId?: string) {
    setBusy(companyId ?? "all");
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyId ? { companyId } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "The check failed.");
      } else if (data.scope === "all") {
        setMessage(
          `Checked ${data.total}: ${data.reachable} reachable, ${data.unreachable} unreachable, ${data.parked} parked, ${data.error} errored.`,
        );
        router.refresh();
      } else {
        setMessage(`Result: ${data.result}${data.httpStatus ? ` (HTTP ${data.httpStatus})` : ""}.`);
        router.refresh();
      }
    } catch {
      setError("Network error. The check may still be running on the server.");
    } finally {
      setBusy(null);
    }
  }

  const neverChecked = companies.filter((c) => c._count.websiteChecks === 0).length;

  return (
    <>
      <section className="panel" style={{ marginBottom: "var(--s-5)" }}>
        <div className="admin-panel-head">
          <div>
            <h2>Website activity</h2>
            <p className="admin-lede">
              Each check is a real HTTP request to the company&apos;s website. Scores come from that
              history only — a listing that has never been checked shows no score rather than a
              made-up one.
            </p>
          </div>
          <button className="btn btn-primary" disabled={busy !== null} onClick={() => run()}>
            {busy === "all" ? "Checking… this can take a while" : "Run checks on all listings"}
          </button>
        </div>

        {neverChecked > 0 && (
          <p className="admin-note">
            {neverChecked} listing{neverChecked === 1 ? " has" : "s have"} never been checked. Run
            the checker to confirm their sites are live — seeded and imported listings arrive
            unverified on purpose.
          </p>
        )}
        <p className="admin-note">
          A full run also happens nightly at 06:00 UTC via Vercel Cron, which needs{" "}
          <code>CRON_SECRET</code> set in your Vercel environment variables.
        </p>

        {message && <p className="form-msg ok">{message}</p>}
        {error && <p className="form-msg err">{error}</p>}
      </section>

      <div className="table-wrap">
        <table className="dir">
          <thead>
            <tr>
              <th>Company</th>
              <th>Activity</th>
              <th>Last result</th>
              <th>Checks</th>
              <th>Last checked</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => {
              const meta = c.websiteStatus ? STATUS_META[c.websiteStatus] : null;
              return (
                <tr key={c.id} className={busy === c.id ? "is-busy" : undefined}>
                  <td>
                    <div className="ent-name">{c.name}</div>
                    <div className="ent-sub mono">{c.website}</div>
                  </td>
                  <td>
                    <ActivityBadge company={c} />
                  </td>
                  <td>
                    {meta ? (
                      <span className={meta.cls}>{meta.label}</span>
                    ) : (
                      <span className="admin-muted">never checked</span>
                    )}
                  </td>
                  <td className="mono">{c._count.websiteChecks}</td>
                  <td className="mono">
                    {c.websiteLastCheckedAt ? timeAgo(c.websiteLastCheckedAt) : "—"}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className="btn btn-ghost btn-xs"
                        disabled={busy !== null}
                        onClick={() => run(c.id)}
                      >
                        Check now
                      </button>
                      <Link className="btn btn-ghost btn-xs" href={`/admin/companies/${c.id}`}>
                        Edit
                      </Link>
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
