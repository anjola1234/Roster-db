import Link from "next/link";

type Perk = { icon: React.ReactNode; label: string };

const PERKS: Perk[] = [
  {
    label: "Save companies and products",
    icon: (
      <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6C19 16.5 12 21 12 21z" />
    ),
  },
  {
    label: "Follow industries and regions",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
  },
  {
    label: "Leave reviews and share insights",
    icon: <path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z" />,
  },
  {
    label: "Build your personalized directory",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    label: "Track companies and ecosystem activity",
    icon: <path d="M3 12h4l2.5-7 5 14L17 12h4" />,
  },
];

export default function SignupCTA() {
  return (
    <div className="cta-band">
      <div className="cta-band-head">
        <h2>
          Unlock the full power
          <br />
          of the ecosystem.
        </h2>
        <p>Create an account to save, track and personalize your experience across the directory.</p>
        <div className="cta-band-actions">
          <Link className="btn btn-primary" href="/signup">
            Create an Account →
          </Link>
          <Link className="btn btn-ghost-light" href="/directory">
            Start Exploring
          </Link>
        </div>
      </div>

      <div className="cta-cols">
        {PERKS.map((p) => (
          <div key={p.label} className="cta-col">
            <span className="ico" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {p.icon}
              </svg>
            </span>
            <span className="cta-col-label">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
