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

type Stage = { n: string; title: string; body: string; cta: { label: string; href: string } };

const STAGES: Stage[] = [
  { n: "01", title: "Discover", body: "Find companies, products and institutions shaping the ecosystem. Search across profiles, industries and markets — what's new, trending and emerging.", cta: { label: "Explore the directory", href: "/directory" } },
  { n: "02", title: "Explore", body: "Move from a name to the full picture: category, region, specialty and how active a company is right now.", cta: { label: "Open a profile", href: "/directory" } },
  { n: "03", title: "Compare", body: "Line entities up side by side across region, specialty and activity to see who actually does what.", cta: { label: "Start comparing", href: "/directory" } },
  { n: "04", title: "Research", body: "See which investors are backing which rounds, and which founders are on record, across the whole directory.", cta: { label: "Research the ecosystem", href: "/directory" } },
  { n: "05", title: "Review", body: "Read and leave first-hand reviews from the customers, patients and operators who have used these products.", cta: { label: "Read reviews", href: "/directory" } },
  { n: "06", title: "Participate", body: "List your own product, follow the industries you care about, and build a personalized view of the ecosystem.", cta: { label: "List your product", href: "/list-your-product" } },
];

const fmt = (n: number) => n.toLocaleString("en-US");
const cat = (m: Match) => m.industry.parent?.name ?? m.industry.name;

function AfricaMap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 150 170" aria-hidden="true">
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
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <span className="pvbar">
      <span className="pvbar-t">
        <span className="pvbar-f" style={{ width: `${pct}%`, background: color }} />
      </span>
      <span className="pvbar-p">{pct}%</span>
    </span>
  );
}

function Logo({ m, size = 26 }: { m: Match; size?: number }) {
  return (
    <span className="pv-lg" style={{ background: m.logoColor, width: size, height: size }}>
      {m.logoInitials}
    </span>
  );
}

// ---- Per-stage previews --------------------------------------------------

function Discover({ matches }: { matches: Match[] }) {
  return (
    <>
      <div className="appframe">
        <div className="appbar">
          <span className="appbar-mark">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
            </svg>
          </span>
          {["a", "b", "c", "d", "e"].map((k) => (
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
                <Logo m={m} />
                <div className="tm-n">{m.name}</div>
                <div className="tm-s">{cat(m)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="heat">
        <AfricaMap className="heat-map" />
        <div className="heat-legend">
          <div className="heat-title">Ecosystem heatmap</div>
          <div className="heat-cap">Companies by region</div>
          <span><i style={{ background: "var(--indigo)" }} />High</span>
          <span><i style={{ background: "#a5b4fc" }} />Medium</span>
          <span><i style={{ background: "#e0e7ff" }} />Low</span>
        </div>
      </div>
    </>
  );
}

function Explore({ matches }: { matches: Match[] }) {
  const m = matches[0];
  return (
    <div className="pv-card pv-profile">
      <div className="pv-prof-head">
        <Logo m={m} size={40} />
        <div>
          <div className="pv-prof-name">{m.name}</div>
          <div className="pv-prof-cat">{cat(m)} · {m.industry.name}</div>
        </div>
        <span className="pv-status"><i />Active</span>
      </div>
      <div className="pv-rows">
        <div className="pv-row"><span className="pv-key">Region</span><span className="pv-val">Nigeria</span></div>
        <div className="pv-row"><span className="pv-key">Specialty</span><span className="pv-val">{m.industry.name}</span></div>
        <div className="pv-row"><span className="pv-key">Activity</span><Bar pct={92} color="var(--emerald)" /></div>
      </div>
      <div className="pv-railmini">
        <span className="pv-chip on">All</span>
        <span className="pv-chip">{cat(m)}</span>
        <span className="pv-chip">{m.industry.name}</span>
      </div>
    </div>
  );
}

function Compare({ matches }: { matches: Match[] }) {
  const cols = matches.slice(0, 2);
  const rows: [string, (m: Match) => React.ReactNode][] = [
    ["Category", (m) => cat(m)],
    ["Specialty", (m) => m.industry.name],
    ["Region", () => "Nigeria"],
  ];
  return (
    <div className="pv-card pv-compare">
      <div className="pv-cmp-head">
        {cols.map((m) => (
          <div key={m.name} className="pv-cmp-col">
            <Logo m={m} />
            <span className="pv-cmp-name">{m.name}</span>
          </div>
        ))}
      </div>
      {rows.map(([label, get]) => (
        <div key={label} className="pv-cmp-row">
          <span className="pv-cmp-key">{label}</span>
          {cols.map((m) => (
            <span key={m.name} className="pv-cmp-val">{get(m)}</span>
          ))}
        </div>
      ))}
      <div className="pv-cmp-row">
        <span className="pv-cmp-key">Activity</span>
        <span className="pv-cmp-val"><Bar pct={92} color="var(--emerald)" /></span>
        <span className="pv-cmp-val"><Bar pct={74} color="var(--amber)" /></span>
      </div>
    </div>
  );
}

function Research({ matches }: { matches: Match[] }) {
  const rounds = ["Series B", "Series A", "Seed"];
  return (
    <div className="pv-card pv-research">
      <div className="pv-res-head">
        <span className="pv-res-title">Investor activity</span>
        <span className="pv-res-cap">Rounds across the directory</span>
      </div>
      {matches.map((m, i) => (
        <div key={m.name} className="pv-res-row">
          <Logo m={m} />
          <div className="pv-res-co">
            <span className="pv-res-name">{m.name}</span>
            <span className="pv-res-sub">{cat(m)}</span>
          </div>
          <span className="pv-avstack">
            <span className="a" /><span className="a" /><span className="a" />
          </span>
          <span className="pv-round">{rounds[i % rounds.length]}</span>
        </div>
      ))}
    </div>
  );
}

function Review({ matches }: { matches: Match[] }) {
  const m = matches[0];
  return (
    <div className="pv-card pv-review">
      <div className="pv-rv-head">
        <span className="pv-rv-av">TA</span>
        <div>
          <div className="pv-rv-name">Tosin A.</div>
          <div className="pv-rv-role">Founder · on {m.name}</div>
        </div>
        <span className="pv-rv-stars">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} width="14" height="14" viewBox="0 0 24 24">
              <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.7l1.2-6-4.5-4.2 6.1-.7z" />
            </svg>
          ))}
        </span>
      </div>
      <p className="pv-rv-body">
        &ldquo;Great for research and discovery — I use it weekly to track companies, funding and ecosystem trends.&rdquo;
      </p>
      <div className="pv-rv-write">
        <span>Write a review…</span>
        <span className="pv-rv-send">Post →</span>
      </div>
    </div>
  );
}

function Participate({ matches }: { matches: Match[] }) {
  return (
    <div className="pv-card pv-participate">
      <div className="pv-pt-title">List your product</div>
      <div className="pv-field">Company name</div>
      <div className="pv-field pv-field-sel">{cat(matches[0])} ▾</div>
      <div className="pv-field">https://yourcompany.com</div>
      <div className="pv-pt-row">
        <span className="pv-pt-submit">Submit for review →</span>
        <span className="pv-pt-follow">＋ Follow {cat(matches[0])}</span>
      </div>
    </div>
  );
}

function Preview({ active, matches }: { active: number; matches: Match[] }) {
  switch (active) {
    case 1: return <Explore matches={matches} />;
    case 2: return <Compare matches={matches} />;
    case 3: return <Research matches={matches} />;
    case 4: return <Review matches={matches} />;
    case 5: return <Participate matches={matches} />;
    default: return <Discover matches={matches} />;
  }
}

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
          <Preview active={active} matches={matches} />
        </div>

        <div className="jdetail" aria-live="polite">
          <h3>
            <span className="jdetail-n">{stage.n}</span> — {stage.title}
          </h3>
          <p>{stage.body}</p>
          <div className="jstats">
            <div className="jstat"><span className="jstat-k">Companies</span><span className="jstat-v">{fmt(stats.companies)}</span></div>
            <div className="jstat"><span className="jstat-k">Industries</span><span className="jstat-v">{fmt(stats.industries)}</span></div>
            <div className="jstat"><span className="jstat-k">States</span><span className="jstat-v">{fmt(stats.regions)}</span></div>
          </div>
          <div className="jnav">
            <Link className="btn btn-primary" href={stage.cta.href}>
              {stage.cta.label} →
            </Link>
            <div className="jnav-arrows">
              <button className="jcirc" type="button" aria-label="Previous stage" onClick={() => step(-1)}>‹</button>
              <button className="jcirc solid" type="button" aria-label="Next stage" onClick={() => step(1)}>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
