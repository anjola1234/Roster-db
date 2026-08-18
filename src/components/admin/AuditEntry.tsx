import Link from "next/link";
import { labelForAction } from "@/lib/audit";

type Entry = {
  id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  targetLabel: string;
  changes: unknown;
  summary: string | null;
  reason: string | null;
  evidence: unknown;
  createdAt: Date;
  ago: string | null;
};

type Change = { field: string; from: unknown; to: unknown };

/** Empty, null and undefined all read as an em dash rather than "null". */
function show(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function isChangeArray(v: unknown): v is Change[] {
  return Array.isArray(v) && v.every((c) => typeof c === "object" && c !== null && "field" in c);
}

/** Which actions are destructive enough to deserve visual weight. */
const SEVERE = new Set(["company.delete", "review.remove", "claim.revoke", "company.reject"]);

export default function AuditEntry({ entry }: { entry: Entry }) {
  const changes = isChangeArray(entry.changes) ? entry.changes : [];
  const evidence = Array.isArray(entry.evidence) ? (entry.evidence as string[]) : [];
  const severe = SEVERE.has(entry.action);

  return (
    <li className={`audit-item${severe ? " is-severe" : ""}`}>
      <div className="audit-head">
        <span className="audit-action">{labelForAction(entry.action)}</span>
        <span className="audit-target">{entry.targetLabel}</span>
        <span className="mono audit-when" title={entry.createdAt.toISOString()}>
          {entry.ago ?? entry.createdAt.toISOString().slice(0, 10)}
        </span>
      </div>

      <div className="audit-meta mono">
        {entry.actorEmail}
        {" · "}
        {entry.entityType}
        {entry.entityId !== "bulk" && entry.entityId !== "all" && (
          <>
            {" · "}
            <Link href={`/admin/audit?entity=${entry.entityId}`}>history</Link>
          </>
        )}
      </div>

      {changes.length > 0 && (
        <table className="audit-diff">
          <tbody>
            {changes.map((c) => (
              <tr key={c.field}>
                <th>{c.field}</th>
                <td className="audit-from">{show(c.from)}</td>
                <td className="audit-arrow">→</td>
                <td className="audit-to">{show(c.to)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {entry.summary && <p className="audit-summary">{entry.summary}</p>}

      {entry.reason && (
        <p className="audit-reason">
          <span className="audit-reason-label">Reason</span>
          {entry.reason}
        </p>
      )}

      {evidence.length > 0 && (
        <p className="audit-evidence mono">
          <span className="audit-reason-label">Evidence</span>
          {evidence.map((e, i) =>
            /^https?:\/\//i.test(e) ? (
              <a key={e} href={e} target="_blank" rel="noopener noreferrer">
                {e}
                {i < evidence.length - 1 ? " · " : ""}
              </a>
            ) : (
              <span key={e}>
                {e}
                {i < evidence.length - 1 ? " · " : ""}
              </span>
            ),
          )}
        </p>
      )}
    </li>
  );
}
