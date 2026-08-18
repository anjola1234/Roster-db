"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CompareRow } from "@/lib/compare";

type Col = { slug: string; name: string; logoInitials: string; logoColor: string };

export default function CompareTable({ companies, rows }: { companies: Col[]; rows: CompareRow[] }) {
  const [differencesOnly, setDifferencesOnly] = useState(false);

  const visible = useMemo(
    () => (differencesOnly ? rows.filter((r) => r.differs) : rows),
    [rows, differencesOnly],
  );

  // Keep the group headers in declaration order rather than alphabetical —
  // the order the rows were built in is the order that reads sensibly.
  const groups = useMemo(() => {
    const seen: string[] = [];
    for (const r of visible) if (!seen.includes(r.group)) seen.push(r.group);
    return seen;
  }, [visible]);

  const identicalCount = rows.length - rows.filter((r) => r.differs).length;

  return (
    <>
      <div className="compare-controls">
        <label className="admin-check">
          <input
            type="checkbox"
            checked={differencesOnly}
            onChange={(e) => setDifferencesOnly(e.target.checked)}
          />
          Show differences only
          {identicalCount > 0 && (
            <span className="admin-muted"> ({identicalCount} identical rows)</span>
          )}
        </label>
      </div>

      <div className="compare-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="compare-corner" />
              {companies.map((c) => (
                <th key={c.slug}>
                  <Link href={`/company/${c.slug}`} className="compare-col-head">
                    <span className="ent-logo" style={{ background: c.logoColor }}>
                      {c.logoInitials}
                    </span>
                    <span className="compare-col-name">{c.name}</span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragmented key={group} group={group} rows={visible} colCount={companies.length} />
            ))}
          </tbody>
        </table>
      </div>

      {visible.length === 0 && (
        <p className="admin-empty">
          These listings are identical on every row compared.
        </p>
      )}
    </>
  );
}

/** A group heading followed by its rows. Split out purely for readability. */
function Fragmented({
  group,
  rows,
  colCount,
}: {
  group: string;
  rows: CompareRow[];
  colCount: number;
}) {
  const groupRows = rows.filter((r) => r.group === group);
  if (!groupRows.length) return null;

  return (
    <>
      <tr className="compare-group">
        <th colSpan={colCount + 1}>{group}</th>
      </tr>
      {groupRows.map((r) => (
        <tr key={r.key} className={r.differs ? "is-different" : undefined}>
          <th scope="row">{r.label}</th>
          {r.values.map((v, i) => (
            <td key={i} className={r.wide ? "is-wide" : undefined}>
              {/^https?:\/\//i.test(v) ? (
                <a href={v} target="_blank" rel="noopener noreferrer">
                  {v.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
                </a>
              ) : (
                v
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
