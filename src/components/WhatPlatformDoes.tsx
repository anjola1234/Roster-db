import Link from "next/link";

const TILES = [
  { icon: "◎", title: "Discover companies", body: "Browse verified fintech and healthcare entities with real, structured profiles.", href: "/directory" },
  { icon: "★", title: "Review products", body: "Read and leave first-hand reviews from customers, patients and operators.", href: "/directory" },
  { icon: "＋", title: "List your product", body: "Submit your own company or institution to join the directory.", href: "/list-your-product" },
  { icon: "⇄", title: "Compare companies", body: "Line entities up side by side across funding, region and specialty.", href: "/directory" },
  { icon: "▤", title: "Explore industries", body: "Drill into Fintech and Healthcare sub-verticals, from Payments to Cardiology.", href: "/directory" },
  { icon: "◈", title: "Follow ecosystem activity", body: "Create an account to track the companies and industries you care about.", href: "/signup" },
  { icon: "◆", title: "Research investors", body: "See which investors are backing which rounds, across the whole directory.", href: "/directory" },
  { icon: "◍", title: "Explore regional markets", body: "Filter by Nigerian state to see what's building where.", href: "/directory" },
];

export default function WhatPlatformDoes() {
  return (
    <div className="feature-grid">
      {TILES.map((t) => (
        <Link key={t.title} href={t.href} className="feature-tile">
          <div className="ico" aria-hidden="true">
            {t.icon}
          </div>
          <h3>{t.title}</h3>
          <p>{t.body}</p>
        </Link>
      ))}
    </div>
  );
}
