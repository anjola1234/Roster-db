"use client";

import { useState } from "react";

type ReviewRow = {
  id: string;
  authorName: string;
  authorRole: string;
  rating: number;
  title: string;
  body: string;
  company: { name: string; slug: string; logoInitials: string; logoColor: string };
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="rv-stars" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="14" height="14" className={i < rating ? "on" : "off"} aria-hidden="true">
          <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.7l1.2-6-4.5-4.2 6.1-.7z" />
        </svg>
      ))}
      <span className="rv-score">{rating.toFixed(1)}</span>
    </span>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export default function ReviewDeck({ reviews }: { reviews: ReviewRow[] }) {
  const [active, setActive] = useState(0);

  if (reviews.length === 0) {
    return <p style={{ color: "var(--muted)" }}>No reviews yet — be the first to share an experience.</p>;
  }

  const featured = reviews[active];
  const step = (dir: number) => setActive((a) => (a + dir + reviews.length) % reviews.length);

  return (
    <div className="reviews-row">
      <div className="reviews-strip-wrap">
        <button className="rv-arrow" aria-label="Previous review" onClick={() => step(-1)} type="button">
          ‹
        </button>
        <div className="reviews-strip" role="list">
          {reviews.map((r, i) => (
            <button
              key={r.id}
              type="button"
              role="listitem"
              className={`rv-card ${i === active ? "is-active" : ""}`}
              onClick={() => setActive(i)}
            >
              <Stars rating={r.rating} />
              <div className="rv-card-name">{r.authorName}</div>
              <p className="rv-card-body">{r.body}</p>
              <div className="rv-card-meta">
                <span className="rv-avatar sm" style={{ background: r.company.logoColor }}>
                  {r.company.logoInitials}
                </span>
                <span className="rv-card-role">{r.authorRole}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rv-featured" aria-live="polite">
        <div className="rv-featured-head">
          <span className="rv-avatar" style={{ background: featured.company.logoColor }}>
            {initials(featured.authorName)}
          </span>
          <div className="rv-featured-who">
            <span className="rv-featured-name">{featured.authorName}</span>
            <span className="rv-featured-role">{featured.authorRole}</span>
          </div>
          <Stars rating={featured.rating} />
        </div>
        <h3 className="rv-featured-title">{featured.title}</h3>
        <p className="rv-featured-body">{featured.body}</p>
        <div className="rv-chips">
          <span className="rv-chip">First-hand review</span>
          <span className="rv-chip">on {featured.company.name}</span>
        </div>
        <div className="rv-featured-foot">
          <span className="rv-count">
            {active + 1} / {reviews.length}
          </span>
          <button className="rv-arrow solid" aria-label="Next review" onClick={() => step(1)} type="button">
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
