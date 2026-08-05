import Link from "next/link";

type Fragment = {
  name: string;
  logoInitials: string;
  logoColor: string;
  industry: { name: string; parent: { name: string } | null };
};

const POSITIONS = [
  { top: "2%", left: "30%" },
  { top: "6%", left: "66%" },
  { top: "30%", left: "4%" },
  { top: "38%", left: "40%" },
  { top: "34%", left: "76%" },
  { top: "68%", left: "12%" },
  { top: "72%", left: "46%" },
];

const TRUSTED = ["Google for Startups", "aws", "goodie", "foodie", "Techpoint", "norrsken"];

function AfricaDots({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 150 170" aria-hidden="true">
      <defs>
        <pattern id="hx-afdots" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.4" cy="1.4" r="1.2" />
        </pattern>
        <clipPath id="hx-afclip">
          <path d="M42 14c14-6 44-3 56 12 8 10 2 22 6 32 4 11-6 21-4 32 2 10-6 18-10 28-4 9-6 22-14 30-6 6-15 2-17-8-3-14-11-20-16-32-6-12-14-24-13-40 1-13-2-27 3-40 3-9 9-18 20-24z" />
        </clipPath>
      </defs>
      <g clipPath="url(#hx-afclip)">
        <rect width="150" height="170" fill="url(#hx-afdots)" />
      </g>
    </svg>
  );
}

export default function Hero({
  fragments,
  investorCount = 0,
  stateCount = 0,
}: {
  fragments: Fragment[];
  investorCount?: number;
  stateCount?: number;
}) {
  const cards = fragments.slice(0, POSITIONS.length);
  const invExtra = investorCount > 4 ? investorCount - 4 : 0;

  return (
    <section className="hx">
      <div className="wrap hx-in">
        <div className="hx-copy">
          <h1 className="hx-title">
            Discover the products <span className="grad-text">building the next wave.</span>
          </h1>
          <p className="hx-sub">
            One directory for the companies and institutions shaping the ecosystem. Every profile adapts to what
            you&rsquo;re browsing, from fintech funding rounds to hospital accreditation.
          </p>
          <div className="hx-cta">
            <Link className="btn btn-primary btn-lg" href="/directory">
              Explore the ecosystem →
            </Link>
            <Link className="btn btn-ghost-light btn-lg" href="#platform">
              ▷ See how it works
            </Link>
          </div>
          <div className="hx-trust">
            <div className="hx-trust-lab">Trusted by builders, investors &amp; researchers</div>
            <div className="hx-logos">
              {TRUSTED.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="hx-stage" aria-hidden="true">
          {cards.map((f, i) => {
            const pos = POSITIONS[i];
            return (
              <div key={f.name + i} className="hx-card" style={{ top: pos.top, left: pos.left }}>
                <div className="hx-card-h">
                  <span className="hx-sw" style={{ background: f.logoColor }}>
                    {f.logoInitials}
                  </span>
                  <span>
                    <span className="hx-cn">{f.name}</span>
                    <span className="hx-cc">{f.industry.parent?.name ?? f.industry.name} · {f.industry.name}</span>
                  </span>
                </div>
              </div>
            );
          })}

          <div className="hx-ctry">
            <div className="hx-ctry-num">{stateCount}</div>
            <div className="hx-ctry-lab">Nigerian states covered</div>
            <AfricaDots className="hx-africa" />
          </div>

          <div className="hx-inv">
            <div className="hx-inv-lab">Top investors</div>
            <div className="hx-inv-stack">
              <span className="a" />
              <span className="a" />
              <span className="a" />
              <span className="a" />
              {invExtra > 0 && <span className="hx-inv-plus">+{invExtra}</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
