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

export default function EcosystemStats({ stats }: { stats: Stats }) {
  const cards = [
    {
      key: "companies",
      label: "Companies",
      value: stats.companies,
      hint: "listed in the pilot",
      explain:
        "Verified and unverified companies and institutions across the Fintech and Healthcare pilot verticals in Nigeria.",
      cta: "Explore Companies →",
      href: "/directory",
    },
    {
      key: "reviews",
      label: "Reviews",
      value: stats.reviews,
      hint: "written by real users",
      explain: "First-hand reviews from customers, patients and operators who have used these products directly.",
      cta: "Read Reviews →",
      href: "/directory",
    },
    {
      key: "investors",
      label: "Investors",
      value: stats.investors,
      hint: "backing the ecosystem",
      explain: "Venture, growth and institutional investors tracked across every disclosed funding round in the directory.",
      cta: "Explore Investors →",
      href: "/directory",
    },
    {
      key: "regions",
      label: "States",
      value: stats.regions,
      hint: "Nigerian states covered",
      explain:
        "This is a Nigeria-only pilot — we track presence across Nigerian states rather than a fabricated global footprint.",
      cta: "Explore States →",
      href: "/directory",
    },
    {
      key: "industries",
      label: "Industries",
      value: stats.industries,
      hint: "verticals & sub-verticals",
      explain: "Two top-level verticals — Fintech and Healthcare — broken down into ten sub-verticals in total.",
      cta: "Explore Industries →",
      href: "/directory",
    },
    {
      key: "people",
      label: "People",
      value: stats.people,
      hint: "founders on record",
      explain: "Founders and leadership on record for the companies and institutions in the directory.",
      cta: "Explore People →",
      href: "/directory",
    },
    {
      key: "features",
      label: "Features",
      value: stats.features,
      hint: "taxonomy tags",
      explain: "The feature and specialty taxonomy used to filter the directory — from payment gateways to cardiology.",
      cta: "Explore Features →",
      href: "/directory",
    },
  ];

  return (
    <div className="stats-masonry">
      {cards.map((c) => (
        <StatCard
          key={c.key}
          label={c.label}
          value={c.value}
          hint={c.hint}
          explain={c.explain}
          cta={c.cta}
          href={c.href}
        />
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  explain,
  cta,
  href,
}: {
  label: string;
  value: number;
  hint: string;
  explain: string;
  cta: string;
  href: string;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className={`stat-card ${flipped ? "is-flipped" : ""}`}>
      <button
        type="button"
        className="flip-surface"
        aria-pressed={flipped}
        onClick={() => setFlipped((v) => !v)}
      >
        <div className="stat-face front">
          <div>
            <div className="big">{value}</div>
            <div className="lbl">{label}</div>
          </div>
          <div className="hint">{hint} · tap to expand</div>
        </div>
        <div className="stat-face back">
          <div className="lbl2">{label}</div>
          <div className="big2">{value}</div>
          <p>{explain}</p>
          <Link className="cta" href={href} onClick={(e) => e.stopPropagation()}>
            {cta}
          </Link>
        </div>
      </button>
    </div>
  );
}
