// Inline-SVG sector icons for the Explore category rail.
//
// The project has no icon dependency (see package.json), so these are small
// hand-written 24x24 stroke icons that inherit `currentColor` — letting the
// rail colour the icon via CSS in both the active and inactive states.
//
// `kindForCategory` maps a real industry/sub-industry name to an icon "kind"
// by keyword. It is intentionally forgiving: anything unmatched falls back to
// the generic grid glyph, so adding a new vertical never renders a blank icon.

type IconKind =
  | "all"
  | "fintech"
  | "payments"
  | "lending"
  | "wealth"
  | "savings"
  | "insurance"
  | "health"
  | "hospital"
  | "grid";

const PATHS: Record<IconKind, React.ReactNode> = {
  // Concentric target — "all sectors"
  all: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  // Coins — fintech (top level)
  fintech: (
    <>
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
      <path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </>
  ),
  // Card — payments
  payments: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </>
  ),
  // Bank columns — lending / infrastructure
  lending: (
    <>
      <path d="M3 9 12 4l9 5" />
      <path d="M5 9v8M12 9v8M19 9v8" />
      <path d="M3 19h18" />
    </>
  ),
  // Trend line — wealth
  wealth: (
    <>
      <path d="M4 16 9 11l3 3 7-8" />
      <path d="M15 6h5v5" />
    </>
  ),
  // Piggy dot — savings
  savings: (
    <>
      <path d="M4 12a6 5 0 0 1 12 0 6 5 0 0 1-12 0Z" />
      <path d="M16 10h3v3M8 8V6M6.5 17v2M13.5 17v2" />
    </>
  ),
  // Shield — insurance / insurtech
  insurance: (
    <>
      <path d="M12 3 5 6v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-3Z" />
    </>
  ),
  // Plus-cross — healthtech
  health: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  // Cross in frame — hospital / specialist
  hospital: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  // Grid — fallback
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
};

/** Map a real category name to an icon kind by keyword. */
export function kindForCategory(name: string): IconKind {
  const n = name.toLowerCase();
  if (n.includes("all")) return "all";
  if (n.includes("payment")) return "payments";
  if (n.includes("lend") || n.includes("infrastructure") || n.includes("bank")) return "lending";
  if (n.includes("wealth") || n.includes("invest")) return "wealth";
  if (n.includes("saving")) return "savings";
  if (n.includes("insur")) return "insurance";
  if (n.includes("hospital") || n.includes("teaching") || n.includes("specialist") || n.includes("clinic"))
    return "hospital";
  if (n.includes("health") || n.includes("care") || n.includes("pharma") || n.includes("med")) return "health";
  if (n.includes("fintech") || n.includes("finance")) return "fintech";
  return "grid";
}

export default function SectorIcon({
  kind,
  size = 18,
}: {
  kind: IconKind;
  size?: number;
}) {
  return (
    <svg
      className="sector-ico"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[kind]}
    </svg>
  );
}
