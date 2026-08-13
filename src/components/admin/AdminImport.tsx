"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IMPORT_COLUMNS, IMPORT_TEMPLATE, parseCsv, rowsToObjects } from "@/lib/csv";
import type { ImportRowResult } from "@/app/api/admin/companies/import/route";

type CheckState = {
  results: ImportRowResult[];
  ok: number;
  failed: number;
  committed: boolean;
};

export default function AdminImport() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [status, setStatus] = useState("draft");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [check, setCheck] = useState<CheckState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function readCsv(raw: string) {
    setText(raw);
    setCheck(null);
    setError("");
    if (!raw.trim()) {
      setRows([]);
      setWarnings([]);
      return;
    }
    const { objects, unknownColumns, missingColumns } = rowsToObjects(parseCsv(raw));
    const notes: string[] = [];
    if (missingColumns.length) notes.push(`Missing required column(s): ${missingColumns.join(", ")}`);
    if (unknownColumns.length) notes.push(`Ignored unrecognised column(s): ${unknownColumns.join(", ")}`);
    setRows(objects);
    setWarnings(notes);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    readCsv(await file.text());
  }

  async function send(mode: "validate" | "commit") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/companies/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, rows, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Import failed.");
        return;
      }
      setCheck({ results: data.results, ok: data.ok, failed: data.failed, committed: mode === "commit" });
      if (mode === "commit") router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const canCommit = check && !check.committed && check.ok > 0;

  return (
    <div className="admin-form">
      <section className="panel">
        <h3 className="admin-section-title">1 · Paste or upload a CSV</h3>
        <p className="admin-lede">
          Required columns: <code>name</code>, <code>industrySlug</code>, <code>regionSlug</code>,{" "}
          <code>website</code>, <code>shortDescription</code>, <code>longDescription</code>.
          Optional: <code>city</code>, <code>foundingYear</code>. Up to 500 rows at a time.
        </p>

        <div className="admin-actions-row" style={{ marginBottom: "var(--s-4)" }}>
          <input type="file" accept=".csv,text/csv" onChange={onFile} aria-label="Upload a CSV file" />
          <button className="btn btn-ghost" type="button" onClick={() => readCsv(IMPORT_TEMPLATE)}>
            Load template row
          </button>
        </div>

        <div className="field">
          <label htmlFor="csv">CSV contents</label>
          <textarea
            id="csv"
            className="admin-csv"
            value={text}
            onChange={(e) => readCsv(e.target.value)}
            placeholder={IMPORT_COLUMNS.join(",")}
          />
        </div>

        {warnings.map((w) => (
          <p key={w} className="form-msg err">
            {w}
          </p>
        ))}
        {rows.length > 0 && (
          <p className="admin-lede">
            {rows.length} data row{rows.length === 1 ? "" : "s"} parsed.
          </p>
        )}
      </section>

      <section className="panel">
        <h3 className="admin-section-title">2 · Check, then import</h3>
        <div className="field">
          <label htmlFor="importStatus">Create these listings as</label>
          <select id="importStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">draft — invisible until you publish each one</option>
            <option value="pending">pending — queued in Submissions</option>
            <option value="active">active — live in the public directory immediately</option>
          </select>
        </div>

        <div className="admin-actions-row">
          <button
            className="btn btn-secondary"
            type="button"
            disabled={busy || !rows.length}
            onClick={() => send("validate")}
          >
            {busy ? "Working…" : "Check rows"}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={busy || !canCommit}
            onClick={() => send("commit")}
          >
            {check ? `Import ${check.ok} row${check.ok === 1 ? "" : "s"}` : "Import"}
          </button>
        </div>
        <p className="admin-note">
          Checking is a dry run — nothing is written. Rows that fail the check are skipped by the
          import; the ones that pass still go in.
        </p>

        {error && <p className="form-msg err">{error}</p>}

        {check && (
          <>
            <p className={check.failed ? "form-msg err" : "form-msg ok"}>
              {check.committed
                ? `Imported ${check.ok} listing${check.ok === 1 ? "" : "s"}.`
                : `${check.ok} row${check.ok === 1 ? "" : "s"} ready.`}
              {check.failed > 0 && ` ${check.failed} row${check.failed === 1 ? "" : "s"} with problems:`}
            </p>
            <div className="table-wrap">
              <table className="dir">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Name</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {check.results.map((r) => (
                    <tr key={r.row}>
                      <td className="mono">{r.row}</td>
                      <td>{r.name}</td>
                      <td>
                        {r.ok ? (
                          <span className="pill emerald">
                            {check.committed ? "created" : "ok"} · /{r.slug}
                          </span>
                        ) : (
                          <span className="pill amber">{r.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
