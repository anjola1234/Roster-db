"use client";

import { useState } from "react";
import Link from "next/link";

type Stage = {
  n: string;
  title: string;
  body: string;
  caps: string[];
  cta: { label: string; href: string };
};

// The six-stage arc from PROJECT_OVERVIEW: Discover, Explore, Compare,
// Research, Review, Participate. The numbering is meaningful — a real
// sequence, not decoration.
const STAGES: Stage[] = [
  {
    n: "01",
    title: "Discover",
    body: "Find the companies, products and institutions shaping the ecosystem — verified and unverified, all in one place.",
    caps: ["Search everything", "Browse by sector", "Structured profiles"],
    cta: { label: "Explore the directory", href: "/directory" },
  },
  {
    n: "02",
    title: "Explore",
    body: "Move from a name to the full picture: funding, region, specialty and how active a company is right now.",
    caps: ["Sector rail", "Region and status filters", "Live activity signals"],
    cta: { label: "Open the directory", href: "/directory" },
  },
  {
    n: "03",
    title: "Compare",
    body: "Line entities up side by side across funding, region and specialty to see who actually does what.",
    caps: ["Side by side", "Funding", "Specialty"],
    cta: { label: "Start comparing", href: "/directory" },
  },
  {
    n: "04",
    title: "Research",
    body: "See which investors are backing which rounds, and which founders are on record, across the whole directory.",
    caps: ["Investors", "Funding rounds", "People on record"],
    cta: { label: "Research the ecosystem", href: "/directory" },
  },
  {
    n: "05",
    title: "Review",
    body: "Read and leave first-hand reviews from the customers, patients and operators who have used these products directly.",
    caps: ["First-hand", "Unmoderated", "By real users"],
    cta: { label: "Read reviews", href: "/directory" },
  },
  {
    n: "06",
    title: "Participate",
    body: "List your own product, follow the industries you care about, and build a personalized view of the ecosystem.",
    caps: ["List your product", "Follow industries", "Personal shortlist"],
    cta: { label: "List your product", href: "/list-your-product" },
  },
];

export default function WhatPlatformDoes() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active];

  return (
    <div className="journey">
      <div className="journey-rail" role="tablist" aria-label="What you can do on the platform">
        {STAGES.map((s, i) => {
          const on = i === active;
          return (
            <button
              key={s.n}
              type="button"
              role="tab"
              aria-selected={on}
              className={`journey-tab ${on ? "is-active" : ""}`}
              onClick={() => setActive(i)}
            >
              <span className="journey-n">{s.n}</span>
              <span className="journey-t">{s.title}</span>
            </button>
          );
        })}
      </div>

      <div className="journey-panel">
        <div className="journey-index" aria-hidden="true">
          {stage.n}
        </div>
        <div className="journey-detail">
          <h3>
            <span className="journey-detail-n">{stage.n}</span> — {stage.title}
          </h3>
          <p>{stage.body}</p>
          <div className="journey-caps">
            {stage.caps.map((c) => (
              <span key={c} className="journey-cap">
                {c}
              </span>
            ))}
          </div>
          <Link className="btn btn-primary" href={stage.cta.href}>
            {stage.cta.label} →
          </Link>
        </div>
      </div>
    </div>
  );
}
