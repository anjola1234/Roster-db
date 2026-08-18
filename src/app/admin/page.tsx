import Link from "next/link";
import { getQueueCounts, getPendingSubmissions, getClaimQueue, getReviewQueue } from "@/lib/adminQueries";
import { prisma } from "@/lib/prisma";
import { labelForAction } from "@/lib/audit";
import { timeAgo } from "@/lib/format";

export default async function AdminOverviewPage() {
  const [counts, submissions, claims, reviews, recentActions] = await Promise.all([
    getQueueCounts(),
    getPendingSubmissions(),
    getClaimQueue(),
    getReviewQueue(),
    // Spec section 11 asks the overview to surface recently changed companies.
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const tiles = [
    {
      href: "/admin/submissions",
      label: "Submissions awaiting review",
      value: counts.pendingCompanies,
      hint: "Listings the public submitted",
    },
    {
      href: "/admin/claims",
      label: "Ownership claims to verify",
      value: counts.pendingClaims,
      hint: "People saying they run a listed company",
    },
    {
      href: "/admin/reviews",
      label: "Reviews awaiting moderation",
      value: counts.pendingReviews,
      hint: "Not visible publicly until published",
    },
    {
      href: "/admin/companies?verification=flagged",
      label: "Flagged listings",
      value: counts.flagged,
      hint: "Marked as needing another look",
    },
  ];

  return (
    <>
      <div className="admin-tiles">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="admin-tile">
            <span className="admin-tile-value">{tile.value}</span>
            <span className="admin-tile-label">{tile.label}</span>
            <span className="admin-tile-hint">{tile.hint}</span>
          </Link>
        ))}
      </div>

      <div className="admin-grid-2">
        <section className="panel">
          <div className="admin-panel-head">
            <h2>Oldest waiting</h2>
            <span className="mono admin-muted">First in, first out</span>
          </div>
          {submissions.length === 0 && claims.length === 0 && reviews.length === 0 ? (
            <p className="admin-empty">Nothing is waiting on you. All queues are clear.</p>
          ) : (
            <ul className="admin-feed">
              {submissions.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <span className="pill">Submission</span>
                  <Link href="/admin/submissions">{s.name}</Link>
                  <span className="mono admin-muted">{timeAgo(s.createdAt)}</span>
                </li>
              ))}
              {claims.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <span className="pill indigo">Claim</span>
                  <Link href="/admin/claims">
                    {c.user.email} → {c.company.name}
                  </Link>
                  <span className="mono admin-muted">{timeAgo(c.createdAt)}</span>
                </li>
              ))}
              {reviews.slice(0, 4).map((r) => (
                <li key={r.id}>
                  <span className="pill amber">Review</span>
                  <Link href="/admin/reviews">
                    {r.rating}★ on {r.company.name}
                  </Link>
                  <span className="mono admin-muted">{timeAgo(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="admin-panel-head">
            <h2>Recent admin activity</h2>
            <Link className="mono admin-muted" href="/admin/audit">
              Full log →
            </Link>
          </div>
          {recentActions.length === 0 ? (
            <p className="admin-empty">No admin actions recorded yet.</p>
          ) : (
            <ul className="admin-feed">
              {recentActions.map((a) => (
                <li key={a.id}>
                  <span className="pill">{labelForAction(a.action)}</span>
                  <Link href={`/admin/audit?entity=${a.entityId}`}>{a.targetLabel}</Link>
                  <span className="mono admin-muted">{timeAgo(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="admin-panel-head">
            <h2>Add companies</h2>
          </div>
          <p className="admin-lede">
            {counts.total} listings in the directory, {counts.drafts} of them still drafts.
          </p>
          <div className="admin-actions-col">
            <Link className="btn btn-primary" href="/admin/companies/new">
              Add one company
            </Link>
            <Link className="btn btn-secondary" href="/admin/companies/import">
              Bulk import from CSV
            </Link>
            <Link className="btn btn-ghost" href="/admin/companies">
              Browse and edit all listings
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
