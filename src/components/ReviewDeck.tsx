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

function stars(n: number) {
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

const VISIBLE_DEPTH = 4;

export default function ReviewDeck({ reviews }: { reviews: ReviewRow[] }) {
  const [order, setOrder] = useState<number[]>(reviews.map((_, i) => i));

  if (reviews.length === 0) {
    return <p style={{ color: "var(--muted)" }}>No reviews yet.</p>;
  }

  function cycle() {
    setOrder((prev) => {
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  }

  const current = reviews[order[0]];

  return (
    <div className="reviews-layout">
      <div>
        <div className="deck">
          {order
            .slice(0, VISIBLE_DEPTH)
            .map((idx, depth) => {
              const r = reviews[idx];
              const isFront = depth === 0;
              const offset = depth * 10;
              const scale = 1 - depth * 0.035;
              return (
                <button
                  key={r.id}
                  type="button"
                  className="deck-card"
                  style={{
                    zIndex: VISIBLE_DEPTH - depth,
                    transform: `translateY(${offset}px) scale(${scale})`,
                    opacity: 1 - depth * 0.15,
                    cursor: isFront ? "pointer" : "default",
                    pointerEvents: isFront ? "auto" : "none",
                  }}
                  onClick={isFront ? cycle : undefined}
                  aria-label={isFront ? `Reviewing ${r.company.name}. Activate to see the next review.` : undefined}
                  tabIndex={isFront ? 0 : -1}
                >
                  <span className="stars" aria-hidden="true">
                    {stars(r.rating)}
                  </span>
                  <p className="body-preview">&ldquo;{r.body}&rdquo;</p>
                  <div className="who">
                    <span className="avatar" style={{ background: r.company.logoColor }}>
                      {r.company.logoInitials}
                    </span>
                    <span>
                      <span className="name">{r.authorName}</span>
                      <br />
                      <span className="role">on {r.company.name}</span>
                    </span>
                  </div>
                </button>
              );
            })
            .reverse()}
        </div>
        <p className="deck-hint">Tap the top card to see the next review · {reviews.length} total</p>
      </div>

      <div className="review-detail" aria-live="polite">
        <div className="co-line">
          <span className="co-logo" style={{ background: current.company.logoColor }}>
            {current.company.logoInitials}
          </span>
          <span className="eyebrow">{current.company.name}</span>
        </div>
        <span className="stars">{stars(current.rating)}</span>
        <h3>{current.title}</h3>
        <p className="body">{current.body}</p>
        <div className="who">
          <span className="avatar" style={{ background: current.company.logoColor }}>
            {current.authorName
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span>
            <span className="name" style={{ fontWeight: 600 }}>
              {current.authorName}
            </span>
            <br />
            <span className="role" style={{ color: "var(--muted)", fontSize: 12.5 }}>
              {current.authorRole}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
