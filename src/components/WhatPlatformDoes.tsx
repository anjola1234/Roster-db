"use client";

import { useState } from "react";
import Link from "next/link";

type Match = {
  name: string;
  logoInitials: string;
  logoColor: string;
  industry: { name: string; parent: { name: string } | null };
};

type Stats = { companies: number; industries: number; regions: number };

type Stage = {
  n: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
};

const STAGES: Stage[] = [
  {
    n: "01",
    title: "Discover",
    body: "Find companies, products and institutions shaping the ecosystem. Search across profiles, industries and markets — what's new, trending and emerging.",
    cta: { label: "Explore the directory", href: "/directory" },
  },
  {
    n: "02",
    title: "Explore",
    body: "Move from a name to the full picture: funding, region, specialty and how active a company is right now.",
    cta: { label: "Open the directory", href: "/directory" },
  },
  {
    n: "03",
    title: "Compare",
    body: "Line entities up side by side across funding, region and specialty to see who actually does what.",
    cta: { label: "Start comparing", href: "/directory" },
  },
  {
    n: "04",
    title: "Research",
    body: "See which investors are backing which rounds, and which founders are on record, across the whole directory.",
    cta: { label: "Research the ecosystem", href: "/directory" },
  },
  {
    n: "05",
    title: "Review",
    body: "Read and leave first-hand reviews from the customers, patients and operators who have used these products.",
    cta: { label: "Read reviews", href: "/directory" },
  },
  {
    n: "06",
    title: "Participate",
    body: "List your own product, follow the industries you care about, and build a personalized view of the ecosystem.",
    cta: { label: "List your product", href: "/list-your-product" },
  },
];

const fmt = (n: number) => n.toLocaleString("en-US");

export default function WhatPlatformDoes({ stats, topMatches }: { stats: Stats; topMatches: Match[] }) {
  const [active, setActive] = useState(0);
  const stage = STAGES[active];
  const step = (d: number) => setActive((a) => (a + d + STAGES.length) % STAGES.length);
  const matches = topMatches.slice(0, 3);

  return (
    <div className="journey">
      <div className="journey-rail" role="tablist" aria-label="What you can do on the platform">
        {STAGES.map((s, i) => (
          <button
            key={s.n}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`journey-tab ${i === active ? "is-active" : ""}`}
            onClick={() => setActive(i)}
          >
            <span className="journey-n">{s.n}</span>
            <span className="journey-t">{s.title}</span>
          </button>
        ))}
      </div>

      <div className="jpanel">
        <div className="jpanel-preview" aria-hidden="true">
          <div className="appframe">
            <div className="appbar">
              <span className="appbar-mark">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
                  <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
                </svg>
              </span>
              {["home", "layers", "search", "grid", "user"].map((k) => (
                <span key={k} className="appbar-i" />
              ))}
            </div>
            <div className="appbody">
              <div className="appsearch">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4-4" />
                </svg>
                Search companies, products, industries…
              </div>
              <div className="tm-lab">Top matches</div>
              <div className="tm">
                {matches.map((m) => (
                  <div key={m.name} className="tm-card">
                    <span className="tm-lg" style={{ background: m.logoColor }}>
                      {m.logoInitials}
                    </span>
                    <div className="tm-n">{m.name}</div>
                    <div className="tm-s">{m.industry.parent?.name ?? m.industry.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="heat">
            <svg className="heat-map" viewBox="0 0 150 170">
              <defs>
                <pattern id="jr-afdots" width="6" height="6" patternUnits="userSpaceOnUse">
                  <circle cx="1.4" cy="1.4" r="1.2" />
                </pattern>
                <clipPath id="jr-afclip">
                  <path d="M42 14c14-6 44-3 56 12 8 10 2 22 6 32 4 11-6 21-4 32 2 10-6 18-10 28-4 9-6 22-14 30-6 6-15 2-17-8-3-14-11-20-16-32-6-12-14-24-13-40 1-13-2-27 3-40 3-9 9-18 20-24z" />
                </clipPath>
              </defs>
              <g clipPath="url(#jr-afclip)">
                <rect width="150" height="170" fill="url(#jr-afdots)" />
              </g>
            </svg>
            <div className="heat-legend">
              <div className="heat-title">Ecosystem heatmap</div>
              <div className="heat-cap">Companies by region</div>
              <span>
                <i style={{ background: "var(--indigo)" }} />
                High
              </span>
              <span>
                <i style={{ background: "#a5b4fc" }} />
                Medium
              </span>
              <span>
                <i style={{ background: "#e0e7ff" }} />
                Low
              </span>
            </div>
          </div>
        </div>

        <div className="jdetail" aria-live="polite">
          <h3>
            <span className="jdetail-n">{stage.n}</span> — {stage.title}
          </h3>
          <p>{stage.body}</p>
          <div className="jstats">
            <div className="jstat">
              <span className="jstat-k">Companies</span>
              <span className="jstat-v">{fmt(stats.companies)}</span>
            </div>
            <div className="jstat">
              <span className="jstat-k">Industries</span>
              <span className="jstat-v">{fmt(stats.industries)}</span>
            </div>
            <div className="jstat">
              <span className="jstat-k">States</span>
              <span className="jstat-v">{fmt(stats.regions)}</span>
            </div>
          </div>
          <div className="jnav">
            <Link className="btn btn-primary" href={stage.cta.href}>
              {stage.cta.label} →
            </Link>
            <div className="jnav-arrows">
              <button className="jcirc" type="button" aria-label="Previous stage" onClick={() => step(-1)}>
                ‹
              </button>
              <button className="jcirc solid" type="button" aria-label="Next stage" onClick={() => step(1)}>
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
