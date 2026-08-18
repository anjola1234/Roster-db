import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { ACTION_GROUPS, labelForAction } from "@/lib/audit";
import { timeAgo } from "@/lib/format";
import AuditEntry from "@/components/admin/AuditEntry";

const PAGE_SIZE = 50;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; group?: string; entity?: string; q?: string; page?: string }>;
}) {
  const { action, group, entity, q, page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);

  const AND: Prisma.AuditLogWhereInput[] = [];
  if (action) AND.push({ action });
  else if (group && ACTION_GROUPS[group]) AND.push({ action: { in: ACTION_GROUPS[group] } });
  if (entity) AND.push({ entityId: entity });
  if (q) {
    AND.push({
      OR: [
        { targetLabel: { contains: q, mode: "insensitive" } },
        { actorEmail: { contains: q, mode: "insensitive" } },
        { reason: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  const where = AND.length ? { AND } : {};

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (pageNum - 1) * PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { action, group, entity, q, page: String(pageNum), ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return p.toString();
  };

  return (
    <>
      <div className="admin-panel-head admin-page-head">
        <div>
          <h2>Audit log</h2>
          <p className="admin-lede">
            Every consequential admin action, append-only and oldest preserved. Entries are never
            edited or deleted from the product — if something here is wrong, the correction is a new
            entry, not a rewrite.
          </p>
        </div>
        <span className="mono admin-muted">{total} entries</span>
      </div>

      <form className="admin-filters" action="/admin/audit">
        <input
          className="control"
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search target, admin email, or reason…"
          aria-label="Search the audit log"
        />
        <select className="control" name="group" defaultValue={group ?? ""} aria-label="Filter by area">
          <option value="">All areas</option>
          {Object.keys(ACTION_GROUPS).map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select className="control" name="action" defaultValue={action ?? ""} aria-label="Filter by action">
          <option value="">All actions</option>
          {Object.values(ACTION_GROUPS)
            .flat()
            .map((a) => (
              <option key={a} value={a}>
                {labelForAction(a)}
              </option>
            ))}
        </select>
        <button className="btn btn-secondary" type="submit">
          Filter
        </button>
        {(action || group || q || entity) && (
          <Link className="btn btn-ghost" href="/admin/audit">
            Clear
          </Link>
        )}
      </form>

      {entity && (
        <p className="admin-note">
          Showing history for one record only.{" "}
          <Link href="/admin/audit">Show everything</Link>
        </p>
      )}

      {entries.length === 0 ? (
        <p className="admin-empty">
          {total === 0 && !action && !group && !q && !entity
            ? "Nothing logged yet. The log starts from the moment it was added — earlier actions were never recorded and can't be recovered."
            : "No entries match these filters."}
        </p>
      ) : (
        <ol className="audit-list">
          {entries.map((e) => (
            <AuditEntry key={e.id} entry={{ ...e, ago: timeAgo(e.createdAt) }} />
          ))}
        </ol>
      )}

      {pages > 1 && (
        <div className="admin-actions-row" style={{ marginTop: "var(--s-5)" }}>
          {pageNum > 1 && (
            <Link className="btn btn-ghost" href={`/admin/audit?${qs({ page: String(pageNum - 1) })}`}>
              ← Newer
            </Link>
          )}
          <span className="mono admin-muted">
            Page {pageNum} of {pages}
          </span>
          {pageNum < pages && (
            <Link className="btn btn-ghost" href={`/admin/audit?${qs({ page: String(pageNum + 1) })}`}>
              Older →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
