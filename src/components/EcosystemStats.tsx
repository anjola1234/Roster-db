"use client";

import { useState } from "react";
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

// ---- Motifs (live on the back face) --------------------------------------

function Sparkline() {
  return (
    <svg viewBox="0 0 120 40" className="mviz" preserveAspectRatio="none" aria-hidden="true">
      <polyline className="spark" points="0,32 18,26 34,28 52,18 70,22 88,10 104,14 120,4" fill="none" />
      {[[18, 26], [52, 18], [88, 10], [120, 4]].map(([x, y], i) => (
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
function AfricaMap() {
  return (
    <svg viewBox="0 0 150 170" className="africa" aria-hidden="true">
      <defs>
        <pattern id="ew-afdots" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.4" cy="1.4" r="1.2" />
        </pattern>
        <clipPath id="ew-afclip">
          <path d="M42 14c14-6 44-3 56 12 8 10 2 22 6 32 4 11-6 21-4 32 2 10-6 18-10 28-4 9-6 22-14 30-6 6-15 2-17-8-3-14-11-20-16-32-6-12-14-24-13-40 1-13-2-27 3-40 3-9 9-18 20-24z" />
        </clipPath>
      </defs>
      <g clipPath="url(#ew-afclip)">
        <rect width="150" height="170" fill="url(#ew-afdots)" />
      </g>
    </svg>
  );
}

type CardProps = {
  area: string;
  value: string;
  label: string;
  sub: string;
  href: string;
  viz: React.ReactNode;
};

function FlipCard({ area, value, label, sub, href, viz }: CardProps) {
  const [flipped, setFlipped] = useState(false);
  const toggle = () => setFlipped((v) => !v);
  return (
    <div className={`ewall-card ewall-${area} ${flipped ? "is-flipped" : ""}`}>
      <div
        className="flip"
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={`${label}: ${value}. Activate to ${flipped ? "hide" : "see"} details.`}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <div className="flip-inner">
          <div className="flip-front">
            <span className="ewall-label">{label}</span>
            <div className="ewall-num">{value}</div>
            <span className="flip-hint">See more →</span>
          </div>
          <div className="flip-back">
            <span className="ewall-label">{label}</span>
            <p className="ewall-sub">{sub}</p>
            <div className="ewall-viz">{viz}</div>
            <Link className="ewall-cta" href={href} onClick={(e) => e.stopPropagation()}>
              Explore {label.toLowerCase()} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EcosystemStats({ stats }: { stats: Stats }) {
  return (
    <div className="ewall">
      <FlipCard area="companies" value={fmt(stats.companies)} label="Companies" href="/directory"
        sub="Companies and institutions across the Fintech and Healthcare pilot verticals." viz={<Sparkline />} />
      <FlipCard area="reviews" value={fmt(stats.reviews)} label="Reviews" href="/directory"
        sub="First-hand reviews from customers, patients and operators who've used these products." viz={<Stars />} />
      <FlipCard area="investors" value={fmt(stats.investors)} label="Investors" href="/directory"
        sub="Venture, growth and institutional investors tracked across every disclosed round."
        viz={<Avatars n={3} plus={stats.investors > 3 ? stats.investors - 3 : undefined} />} />
      <FlipCard area="map" value={fmt(stats.regions)} label="States" href="/directory"
        sub="A Nigeria-only pilot. Every company is mapped to the Nigerian states it operates in — real coverage, not a fabricated global footprint."
        viz={<AfricaMap />} />
      <FlipCard area="industries" value={fmt(stats.industries)} label="Industries" href="/directory"
        sub="Two top-level verticals — Fintech and Healthcare — broken into their sub-verticals." viz={<Layers />} />
      <FlipCard area="people" value={fmt(stats.people)} label="People" href="/directory"
        sub="Founders and operators on record for the companies in the directory."
        viz={<Avatars n={4} plus={stats.people > 4 ? stats.people - 4 : undefined} />} />
      <FlipCard area="features" value={fmt(stats.features)} label="Features" href="/directory"
        sub="Taxonomy tags to discover, compare and filter the directory — from payment gateways to cardiology." viz={<Lightning />} />
    </div>
  );
}
