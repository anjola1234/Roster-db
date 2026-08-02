// Compact "how alive is this company" indicator, shared by the directory
// table, the homepage preview table, and (in its `lg` size) the company
// detail page. Accessibility requirement: never rely on color alone — the
// text label and/or percentage is always shown alongside the color.

export type ActivityCompany = {
  lifecycleStatus: string;
  activityScore: number | null;
  activityLabel: string | null;
};

const LIFECYCLE_META: Record<string, { emoji: string; label: string; cls: string }> = {
  closed: { emoji: "🔴", label: "Closed", cls: "act-red" },
  acquired: { emoji: "🟣", label: "Acquired", cls: "act-purple" },
  merged: { emoji: "🔵", label: "Merged", cls: "act-blue" },
  unverified: { emoji: "⚫", label: "Unverified", cls: "act-darkgray" },
};

const ACTIVITY_META: Record<string, { emoji: string; label: string; cls: string }> = {
  growing: { emoji: "🟢", label: "Growing", cls: "act-green" },
  active: { emoji: "🟢", label: "Active", cls: "act-green" },
  low_activity: { emoji: "🟡", label: "Low Activity", cls: "act-amber" },
  at_risk: { emoji: "🟠", label: "At Risk", cls: "act-orange" },
  dormant: { emoji: "⚪", label: "Dormant", cls: "act-gray" },
};

export default function ActivityBadge({ company, size = "sm" }: { company: ActivityCompany; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "lg" : "";

  if (company.lifecycleStatus !== "operating") {
    const meta = LIFECYCLE_META[company.lifecycleStatus] ?? LIFECYCLE_META.unverified;
    return (
      <span className={`activity-badge ${sizeClass} ${meta.cls}`}>
        <span className="act-line">
          <span className="act-dot">{meta.emoji}</span> {meta.label}
        </span>
      </span>
    );
  }

  if (company.activityScore == null || !company.activityLabel) {
    const meta = LIFECYCLE_META.unverified;
    return (
      <span className={`activity-badge ${sizeClass} ${meta.cls}`}>
        <span className="act-line">
          <span className="act-dot">{meta.emoji}</span> {meta.label}
        </span>
      </span>
    );
  }

  const meta = ACTIVITY_META[company.activityLabel] ?? ACTIVITY_META.dormant;
  const score = company.activityScore;
  return (
    <span className={`activity-badge ${sizeClass} ${meta.cls}`}>
      <span className="act-line">
        <span className="act-dot">{meta.emoji}</span> {meta.label} · <span className="act-pct">{score}%</span>
      </span>
      <span className="act-bar" role="img" aria-label={`Activity score ${score} percent`}>
        <span style={{ width: `${score}%` }} />
      </span>
    </span>
  );
}
