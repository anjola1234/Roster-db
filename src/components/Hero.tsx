import Link from "next/link";

type Fragment = {
  name: string;
  logoInitials: string;
  logoColor: string;
  logoUrl?: string | null; // optional real logo; falls back to the initials swatch
  industry: { name: string; parent: { name: string } | null };
};

const TRUSTED = ["Google for Startups", "aws", "goodie", "Techpoint", "norrsken"];

const WALL_COLS = 5;
const WALL_MIN = 40; // tile real companies up to this many entries for density
// Per-column drift speeds (seconds) — different speeds read as parallax.
const COL_SPEED = [25, 30, 35, 40, 45];

function tile(items: Fragment[], min: number): Fragment[] {
  if (items.length === 0) return [];
  const out: Fragment[] = [];
  while (out.length < min) out.push(...items);
  return out.slice(0, Math.max(min, items.length));
}

function chunk<T>(arr: T[], cols: number): T[][] {
  const out: T[][] = Array.from({ length: cols }, () => []);
  arr.forEach((item, i) => out[i % cols].push(item));
  return out;
}

function WallItem({ f }: { f: Fragment }) {
  return (
    <div className="hx-wall-item">
      {f.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="hx-wall-img" src={f.logoUrl} alt="" width={30} height={30} />
      ) : (
        <span className="hx-wall-sw" style={{ background: f.logoColor }}>
          {f.logoInitials}
        </span>
      )}
      <span className="hx-wall-name">{f.name}</span>
    </div>
  );
}

function EcosystemWall({ fragments }: { fragments: Fragment[] }) {
  const pool = tile(fragments, WALL_MIN);
  if (pool.length === 0) return null;
  const columns = chunk(pool, WALL_COLS);
  return (
    <div className="hx-wall" aria-hidden="true">
      <div className="hx-wall-rot">
        {columns.map((col, ci) => (
          <div
            key={ci}
            className="hx-wall-col"
            style={{ animationDuration: `${COL_SPEED[ci % COL_SPEED.length]}s` }}
          >
            {/* duplicated once so the vertical drift loops seamlessly */}
            {[...col, ...col].map((f, i) => (
              <WallItem key={ci + "-" + i} f={f} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const invExtra = investorCount > 4 ? investorCount - 4 : 0;

  return (
    <section className="hx">
      <EcosystemWall fragments={fragments} />

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
