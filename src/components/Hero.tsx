import Link from "next/link";

type Fragment = {
  name: string;
  logoInitials: string;
  logoColor: string;
  industry: { name: string; parent: { name: string } | null };
};

const POSITIONS = [
  { top: "6%", left: "4%", rotate: -8 },
  { top: "14%", left: "68%", rotate: 6 },
  { top: "2%", left: "38%", rotate: 4 },
  { top: "28%", left: "14%", rotate: 10 },
  { top: "34%", left: "80%", rotate: -6 },
  { top: "44%", left: "48%", rotate: -3 },
  { top: "54%", left: "6%", rotate: 7 },
  { top: "60%", left: "72%", rotate: 5 },
  { top: "8%", left: "88%", rotate: -10 },
  { top: "68%", left: "30%", rotate: -5 },
  { top: "20%", left: "56%", rotate: 9 },
  { top: "48%", left: "24%", rotate: -7 },
  { top: "72%", left: "54%", rotate: 3 },
  { top: "38%", left: "4%", rotate: -4 },
  { top: "4%", left: "58%", rotate: 8 },
  { top: "64%", left: "88%", rotate: -8 },
  { top: "16%", left: "22%", rotate: -6 },
  { top: "56%", left: "42%", rotate: 6 },
];

export default function Hero({ fragments }: { fragments: Fragment[] }) {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        {fragments.slice(0, POSITIONS.length).map((f, i) => {
          const pos = POSITIONS[i % POSITIONS.length];
          return (
            <div
              key={f.name + i}
              className="hero-frag"
              style={{ top: pos.top, left: pos.left, transform: `rotate(${pos.rotate}deg)` }}
            >
              <span className="swatch" style={{ background: f.logoColor }}>
                {f.logoInitials}
              </span>
              <span>
                <span className="name">{f.name}</span>
                <br />
                <span className="ind">{f.industry.parent?.name ?? f.industry.name}</span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="wrap hero-inner">
        <span className="hero-eyebrow eyebrow">
          <span className="dot" /> Live directory · real seeded companies
        </span>
        <h1>
          Discover the products <span className="grad-text">building the next wave.</span>
        </h1>
        <p className="sub">
          One directory for the companies and institutions shaping the ecosystem. Every profile adapts to what
          you&rsquo;re browsing, from fintech funding rounds to hospital accreditation.
        </p>
        <div className="hero-cta">
          <Link className="btn btn-primary btn-lg" href="/directory">
            Explore the ecosystem →
          </Link>
          <Link className="btn btn-secondary btn-lg" href="#platform">
            See how it works
          </Link>
        </div>
        <p className="hero-trust">Built for builders, investors and researchers across the Nigerian ecosystem.</p>
      </div>
    </section>
  );
}
