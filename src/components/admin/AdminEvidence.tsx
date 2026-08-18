"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FRESHNESS_LABELS, SOURCE_KIND_LABELS, freshnessOf, labelForFieldKey } from "@/lib/evidence";
import { timeAgo } from "@/lib/format";

export type EvidenceRow = {
  id: string;
  fieldKey: string;
  valueText: string;
  sourceUrl: string | null;
  confidence: number | null;
  note: string | null;
  isWinning: boolean;
  fetchedAt: Date;
  verifiedAt: Date | null;
  source: { key: string; name: string; kind: string; trustRank: number };
  verifiedBy: { email: string } | null;
};

type Props = {
  companyId: string;
  companyName: string;
  rows: EvidenceRow[];
  sources: { key: string; name: string; kind: string }[];
  fields: { key: string; label: string; group: string }[];
};

export default function AdminEvidence({ companyId, companyName, rows, sources, fields }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fieldKey: fields[0]?.key ?? "",
    valueText: "",
    sourceKey: sources[0]?.key ?? "",
    sourceUrl: "",
    confidence: "",
    note: "",
    isWinning: true,
    verifyNow: false,
  });

  // Group by field so conflicting sources for the same value sit together —
  // that's the whole point of storing more than one.
  const byField = new Map<string, EvidenceRow[]>();
  for (const r of rows) {
    const list = byField.get(r.fieldKey) ?? [];
    list.push(r);
    byField.set(r.fieldKey, list);
  }

  async function act(evidenceId: string, action: string) {
    if (action === "delete" && !window.confirm("Remove this evidence? The audit log keeps a record.")) return;
    setBusy(evidenceId);
    setError("");
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/evidence/${evidenceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? "That didn't work.");
      else router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy("new");
    setError("");
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "That didn't work.");
      } else {
        setForm({ ...form, valueText: "", sourceUrl: "", note: "", confidence: "" });
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const groups = Array.from(new Set(fields.map((f) => f.group)));

  return (
    <>
      <div className="admin-panel-head admin-page-head">
        <div>
          <h2>Evidence — {companyName}</h2>
          <p className="admin-lede">
            Where each fact came from, and whether a person has confirmed it. Recording a source is
            not the same as verifying it: a cited but unverified value is a lead, not a fact.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen((o) => !o)}>
          {open ? "Cancel" : "Attach evidence"}
        </button>
      </div>

      {error && <p className="form-msg err">{error}</p>}

      {open && (
        <form className="panel admin-form" onSubmit={add} style={{ marginBottom: "var(--s-5)" }}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="fieldKey">Field</label>
              <select
                id="fieldKey"
                value={form.fieldKey}
                onChange={(e) => setForm({ ...form, fieldKey: e.target.value })}
              >
                {groups.map((g) => (
                  <optgroup key={g} label={g}>
                    {fields
                      .filter((f) => f.group === g)
                      .map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="sourceKey">Source</label>
              <select
                id="sourceKey"
                value={form.sourceKey}
                onChange={(e) => setForm({ ...form, sourceKey: e.target.value })}
              >
                {sources.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name} — {SOURCE_KIND_LABELS[s.kind] ?? s.kind}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="valueText">Value this evidence supports</label>
            <input
              id="valueText"
              required
              value={form.valueText}
              onChange={(e) => setForm({ ...form, valueText: e.target.value })}
              placeholder="e.g. 2019, or RC1234567, or $170M"
            />
          </div>

          <div className="field">
            <label htmlFor="sourceUrl">Source URL</label>
            <input
              id="sourceUrl"
              type="url"
              value={form.sourceUrl}
              onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
              placeholder="https://…"
            />
          </div>

          <div className="field">
            <label htmlFor="note">Note</label>
            <input
              id="note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="What you checked, and any caveat"
              maxLength={1000}
            />
          </div>

          <div className="admin-checks">
            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.isWinning}
                onChange={(e) => setForm({ ...form, isWinning: e.target.checked })}
              />
              Treat as the authoritative source for this field
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.verifyNow}
                onChange={(e) => setForm({ ...form, verifyNow: e.target.checked })}
              />
              I have personally confirmed this
            </label>
          </div>

          <div className="admin-form-actions">
            <button className="btn btn-primary" type="submit" disabled={busy === "new"}>
              {busy === "new" ? "Saving…" : "Attach evidence"}
            </button>
          </div>
        </form>
      )}

      {rows.length === 0 ? (
        <p className="admin-empty">
          No evidence recorded for this listing yet. Every field shown on the public profile is
          currently unsourced.
        </p>
      ) : (
        Array.from(byField.entries()).map(([fieldKey, list]) => (
          <section className="panel" key={fieldKey} style={{ marginBottom: "var(--s-4)" }}>
            <h3 className="admin-section-title">
              {labelForFieldKey(fieldKey)}
              {list.length > 1 && (
                <span className="admin-muted"> · {list.length} conflicting sources</span>
              )}
            </h3>
            {list.map((r) => (
              <div key={r.id} className={`evidence-row${r.isWinning ? " is-winning" : ""}`}>
                <div className="evidence-main">
                  <div className="evidence-value">{r.valueText}</div>
                  <div className="evidence-meta mono">
                    {r.source.name}
                    {" · "}
                    {SOURCE_KIND_LABELS[r.source.kind] ?? r.source.kind}
                    {r.confidence != null && ` · confidence ${Math.round(r.confidence * 100)}%`}
                    {" · fetched "}
                    {timeAgo(r.fetchedAt) ?? "—"}
                  </div>
                  {r.sourceUrl && (
                    <a className="evidence-link mono" href={r.sourceUrl} target="_blank" rel="noopener noreferrer">
                      {r.sourceUrl} ↗
                    </a>
                  )}
                  {r.note && <p className="evidence-note">{r.note}</p>}
                  <div className="evidence-badges">
                    {r.isWinning && <span className="pill indigo">authoritative</span>}
                    {r.verifiedAt ? (
                      <span className="pill emerald">
                        ✔ verified by {r.verifiedBy?.email ?? "a removed account"} ·{" "}
                        {FRESHNESS_LABELS[freshnessOf(r.verifiedAt)]}
                      </span>
                    ) : (
                      <span className="pill amber">unverified — source recorded only</span>
                    )}
                  </div>
                </div>
                <div className="evidence-actions">
                  {r.verifiedAt ? (
                    <button className="btn btn-ghost btn-xs" disabled={busy === r.id} onClick={() => act(r.id, "unverify")}>
                      Withdraw
                    </button>
                  ) : (
                    <button className="btn btn-ghost btn-xs" disabled={busy === r.id} onClick={() => act(r.id, "verify")}>
                      Verify
                    </button>
                  )}
                  {!r.isWinning && (
                    <button className="btn btn-ghost btn-xs" disabled={busy === r.id} onClick={() => act(r.id, "set-winning")}>
                      Make authoritative
                    </button>
                  )}
                  <button className="btn btn-ghost btn-xs is-danger" disabled={busy === r.id} onClick={() => act(r.id, "delete")}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </section>
        ))
      )}
    </>
  );
}
