"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { SignalDefinition } from "@/lib/activitySignals";

type Props = {
  definitions: SignalDefinition[];
  current: Record<string, number>;
  /** How many listings currently have each signal measured. */
  coverageCounts: Record<string, number>;
  totalCompanies: number;
};

export default function AdminWeights({ definitions, current, coverageCounts, totalCompanies }: Props) {
  const router = useRouter();
  const [weights, setWeights] = useState<Record<string, number>>(current);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const observable = definitions.filter((d) => d.observable);
  const unobservable = definitions.filter((d) => !d.observable);

  // The share each signal takes of the score when everything it needs is
  // present. Shown as a percentage because "0.3" means nothing to a reader.
  const observableTotal = observable.reduce((sum, d) => sum + (weights[d.key] ?? 0), 0);

  const dirty = useMemo(
    () => definitions.some((d) => (weights[d.key] ?? 0) !== (current[d.key] ?? 0)),
    [weights, current, definitions],
  );

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/activity/weights", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "That didn't work.");
      else {
        setMessage(
          "Saved. Scores already stored are unchanged — each listing picks up the new weights the next time it's checked.",
        );
        router.refresh();
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function row(d: SignalDefinition) {
    const measured = coverageCounts[d.key] ?? 0;
    const share = observableTotal > 0 ? Math.round(((weights[d.key] ?? 0) / observableTotal) * 100) : 0;
    return (
      <div className="weight-row" key={d.key}>
        <div className="weight-main">
          <div className="weight-label">
            {d.label}
            {!d.observable && <span className="pill amber">no data source</span>}
          </div>
          <p className="weight-desc">{d.description}</p>
          <p className="weight-coverage mono">
            {d.observable
              ? `Measured for ${measured} of ${totalCompanies} listings`
              : "Never contributes to any score"}
          </p>
        </div>
        <div className="weight-control">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={weights[d.key] ?? 0}
            disabled={!d.observable}
            onChange={(e) => setWeights({ ...weights, [d.key]: Number(e.target.value) })}
            aria-label={`Weight for ${d.label}`}
          />
          <span className="mono weight-value">
            {(weights[d.key] ?? 0).toFixed(2)}
            {d.observable && <span className="weight-share"> · {share}% of score</span>}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="panel" style={{ marginBottom: "var(--s-5)" }}>
        <h3 className="admin-section-title">How the score is built</h3>
        <p className="admin-lede">
          Each signal contributes its weight&apos;s share of the score. Crucially, a signal we
          can&apos;t observe for a listing contributes <strong>nothing</strong> — it is not scored
          as zero. The remaining weights are renormalised, and the listing&apos;s{" "}
          <strong>coverage</strong> figure records how much of the intended picture we actually had.
        </p>
        <p className="admin-note">
          A score of 90 built from one signal is not the same claim as 90 built from five, which is
          why coverage is shown next to every score rather than buried.
        </p>
      </section>

      <section className="panel" style={{ marginBottom: "var(--s-5)" }}>
        <h3 className="admin-section-title">Signals we can measure</h3>
        {observable.map(row)}
      </section>

      <section className="panel" style={{ marginBottom: "var(--s-5)" }}>
        <h3 className="admin-section-title">Signals with no data source</h3>
        <p className="admin-note">
          The product spec lists these, but nothing is connected that could observe them. Rather
          than score them zero — which would penalise every listing for our missing integrations —
          they are excluded entirely. Connect a source and they start counting; the weights are
          kept here so that switch is a configuration change, not a rebalancing exercise.
        </p>
        {unobservable.map(row)}
      </section>

      {message && <p className="form-msg ok">{message}</p>}
      {error && <p className="form-msg err">{error}</p>}

      <div className="admin-form-actions">
        <button className="btn btn-primary" disabled={saving || !dirty} onClick={save}>
          {saving ? "Saving…" : "Save weights"}
        </button>
        <button className="btn btn-ghost" disabled={!dirty} onClick={() => setWeights(current)}>
          Reset
        </button>
      </div>
    </>
  );
}
