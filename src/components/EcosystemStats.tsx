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

type Size = "lg" | "md" | "sm";

type CardDef = {
  key: string;
  label: string;
  value: number;
  suffix?: string;
  hint: string;
  explain: string;
  cta: string;
  href: string;
  size: Size;
  viz: React.ReactNode;
};

const fmt = (n: number) => n.toLocaleString("en-US");

// ---- Small, honest inline motifs -----------------------------------------
// These are iconographic accents, not charts — they add texture without
// implying a dataset we don't have (no fake trend lines or ratings).

function DotGrid() {
  const dots = Array.from({ length: 9 });
  return (
    <svg viewBox="0 0 60 60" className="viz" aria-hidden="true">
      {dots.map((_, i) => {
        const x = 8 + (i % 3) * 22;
        const y = 8 + Math.floor(i / 3) * 22;
        return <circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 5 : 3.5} />;
      })}
    </svg>
  );
}

function StarMark() {
  return (
    <svg viewBox="0 0 24 24" className="viz viz-star" aria-hidden="true">
      <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.7l1.2-6-4.5-4.2 6.1-.7z" />
    </svg>
  );
}

function Layers() {
  return (
    <svg viewBox="0 0 48 40" className="viz viz-stroke" aria-hidden="true">
      <path d="M24 4 44 13 24 22 4 13z" />
      <path d="M4 20l20 9 20-9" />
      <path d="M4 27l20 9 20-9" />
    </svg>
  );
}

function TagChips() {
  return (
    <span className="viz-tags" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function Avatars({ n = 3 }: { n?: number }) {
  return (
    <span className="viz-avatars" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} />
      ))}
    </span>
  );
}

// A rough Nigeria-shaped scatter with a location pin — signals "states", not
// a claim about a wider map.
function MapDots() {
  const pts = [
    [10, 22],
    [22, 14],
    [34, 18],
    [46, 24],
    [18, 30],
    [30, 32],
    [42, 34],
  ];
  return (
    <svg viewBox="0 0 56 44" className="viz" aria-hidden="true">
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.6} />
      ))}
      <path className="pin" d="M28 6c-3.3 0-6 2.6-6 5.9 0 4.4 6 9.1 6 9.1s6-4.7 6-9.1C34 8.6 31.3 6 28 6z" />
      <circle className="pin-dot" cx={28} cy={12} r={2} />
    </svg>
  );
}

export default function EcosystemStats({ stats }: { stats: Stats }) {
  const cards: CardDef[] = [
    {
      key: "companies",
      label: "Companies",
      value: stats.companies,
      hint: "listed in the pilot",
      explain:
        "Verified and unverified companies and institutions across the Fintech and Healthcare pilot verticals in Nigeria.",
      cta: "Explore companies",
      href: "/directory",
      size: "lg",
      viz: <DotGrid />,
    },
    {
      key: "people",
      label: "People",
      value: stats.people,
      hint: "founders on record",
      explain: "Founders and leadership on record for the companies and institutions in the directory.",
      cta: "Explore people",
      href: "/directory",
      size: "md",
      viz: <Avatars n={3} />,
    },
    {
      key: "regions",
      label: "States",
      value: stats.regions,
      hint: "Nigerian states covered",
      explain:
        "This is a Nigeria-only pilot — we track presence across Nigerian states rather than a fabricated global footprint.",
      cta: "Explore states",
      href: "/directory",
      size: "md",
      viz: <MapDots />,
    },
    {
      key: "reviews",
      label: "Reviews",
      value: stats.reviews,
      hint: "first-hand, unmoderated",
      explain: "First-hand reviews from customers, patients and operators who have used these products directly.",
      cta: "Read reviews",
      href: "/directory",
      size: "sm",
      viz: <StarMark />,
    },
    {
      key: "industries",
      label: "Industries",
      value: stats.industries,
      hint: "verticals & sub-verticals",
      explain: "Two top-level verticals — Fintech and Healthcare — broken down into their sub-verticals.",
      cta: "Explore industries",
      href: "/directory",
      size: "sm",
      viz: <Layers />,
    },
    {
      key: "investors",
      label: "Investors",
      value: stats.investors,
      hint: "backing the ecosystem",
      explain: "Venture, growth and institutional investors tracked across every disclosed funding round.",
      cta: "Explore investors",
      href: "/directory",
      size: "sm",
      viz: <Avatars n={4} />,
    },
    {
      key: "features",
      label: "Features",
      value: stats.features,
      hint: "taxonomy tags",
      explain: "The feature and specialty taxonomy used to filter the directory — from payment gateways to cardiology.",
      cta: "Explore features",
      href: "/directory",
      size: "md",
      viz: <TagChips />,
    },
  ];

  return (
    <div className="stat-wall">
      {cards.map((c) => (
        <StatCard key={c.key} card={c} />
      ))}
    </div>
  );
}

function StatCard({ card }: { card: CardDef }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`swall-card is-${card.size} ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="swall-surface"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="swall-viz">{card.viz}</div>
        <div className="swall-num">
          {fmt(card.value)}
          {card.suffix && <span className="swall-suffix">{card.suffix}</span>}
        </div>
        <div className="swall-label">{card.label}</div>
        <div className="swall-hint">{card.hint}</div>
        <div className="swall-more">
          <p>{card.explain}</p>
        </div>
      </button>
      <Link className="swall-cta" href={card.href}>
        {card.cta} →
      </Link>
    </div>
  );
}
