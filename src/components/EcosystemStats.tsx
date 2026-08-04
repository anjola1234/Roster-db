import Link from "next/link";

type Stats = {
  companies: number;
  reviews: number;
  investors: number;
  regions: number;
  industries: number;
  people: number;
  features: number;
};

const fmt = (n: number) => n.toLocaleString("en-US");

// ---- Motifs --------------------------------------------------------------

function Sparkline() {
  return (
    <svg viewBox="0 0 120 40" className="mviz" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        className="spark"
        points="0,32 18,26 34,28 52,18 70,22 88,10 104,14 120,4"
        fill="none"
      />
      {[
        [18, 26],
        [52, 18],
        [88, 10],
        [120, 4],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.4} className="spark-dot" />
      ))}
    </svg>
  );
}

function Stars() {
  return (
    <span className="mviz-stars" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="15" height="15">
          <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.7l1.2-6-4.5-4.2 6.1-.7z" />
        </svg>
      ))}
    </span>
  );
}

function Avatars({ n = 3, plus }: { n?: number; plus?: number }) {
  return (
    <span className="mviz-avatars" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="av" />
      ))}
      {plus != null && plus > 0 && <span className="av-plus">+{fmt(plus)}</span>}
    </span>
  );
}

function Lightning() {
  return (
    <svg viewBox="0 0 24 24" className="mviz-glyph" width="30" height="30" aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

function Layers() {
  return (
    <svg viewBox="0 0 48 40" className="mviz-glyph stroke" width="34" height="30" aria-hidden="true">
      <path d="M24 4 44 13 24 22 4 13z" />
      <path d="M4 20l20 9 20-9" />
      <path d="M4 27l20 9 20-9" />
    </svg>
  );
}

// Dotted Africa silhouette — signals the African ecosystem the directory
// tracks. The number beside it stays real (Nigerian states), so this reads
// as context, not a claim of continent-wide coverage.
function AfricaMap() {
  return (
    <svg viewBox="0 0 150 170" className="africa" aria-hidden="true">
      <defs>
        <pattern id="afdots" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.4" cy="1.4" r="1.2" />
        </pattern>
        <clipPath id="afclip">
          <path d="M42 14c14-6 44-3 56 12 8 10 2 22 6 32 4 11-6 21-4 32 2 10-6 18-10 28-4 9-6 22-14 30-6 6-15 2-17-8-3-14-11-20-16-32-6-12-14-24-13-40 1-13-2-27 3-40 3-9 9-18 20-24z" />
        </clipPath>
      </defs>
      <g clipPath="url(#afclip)">
        <rect x="0" y="0" width="150" height="170" fill="url(#afdots)" />
      </g>
    </svg>
  );
}

export default function EcosystemStats({ stats }: { stats: Stats }) {
  return (
    <div className="ewall">
      <MetricCard
        area="companies"
        value={fmt(stats.companies)}
        label="Companies"
        sub="Across the pilot verticals"
        href="/directory"
        viz={<Sparkline />}
      />
      <MetricCard
        area="reviews"
        value={fmt(stats.reviews)}
        label="Reviews"
        sub="First-hand, from real users"
        href="/directory"
        viz={<Stars />}
      />
      <MetricCard
        area="investors"
        value={fmt(stats.investors)}
        label="Investors"
        sub="Backing the ecosystem"
        href="/directory"
        viz={<Avatars n={3} plus={stats.investors > 3 ? stats.investors - 3 : undefined} />}
      />
      <MapCard value={fmt(stats.regions)} />
      <MetricCard
        area="industries"
        value={fmt(stats.industries)}
        label="Industries"
        sub="Verticals & sub-verticals"
        href="/directory"
        viz={<Layers />}
      />
      <MetricCard
        area="people"
        value={fmt(stats.people)}
        label="People"
        sub="Founders on record"
        href="/directory"
        viz={<Avatars n={4} plus={stats.people > 4 ? stats.people - 4 : undefined} />}
      />
      <MetricCard
        area="features"
        value={fmt(stats.features)}
        label="Features"
        sub="Taxonomy tags to discover, compare & filter the directory"
        href="/directory"
        viz={<Lightning />}
        wide
      />
    </div>
  );
}

function MetricCard({
  area,
  value,
  label,
  sub,
  href,
  viz,
  wide,
}: {
  area: string;
  value: string;
  label: string;
  sub: string;
  href: string;
  viz: React.ReactNode;
  wide?: boolean;
}) {
  const wideCls = wide ? "is-wide" : "";
  return (
    <div className={`ewall-card ewall-${area} ${wideCls}`} data-area={area}>
      <div className="ewall-surface">
        <div className="ewall-top">
          <span className="ewall-label">{label}</span>
        </div>
        <div className="ewall-num">{value}</div>
        <p className="ewall-sub">{sub}</p>
        <div className="ewall-viz">{viz}</div>
        <Link className="ewall-cta" href={href}>
          Explore {label.toLowerCase()} →
        </Link>
      </div>
    </div>
  );
}

function MapCard({ value }: { value: string }) {
  return (
    <div className="ewall-card ewall-map">
      <div className="ewall-surface ewall-map-surface">
        <span className="ewall-label">States</span>
        <div className="ewall-num">{value}</div>
        <p className="ewall-sub">
          A Nigeria-only pilot. Every company is mapped to the Nigerian states it operates in — real coverage, not a
          fabricated global footprint.
        </p>
        <div className="ewall-map-art">
          <AfricaMap />
        </div>
        <Link className="ewall-cta" href="/directory">
          Explore states →
        </Link>
      </div>
    </div>
  );
}
