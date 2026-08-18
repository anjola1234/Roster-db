import type { CompanyFull } from "@/lib/queries";
import { EXTENSION_SCHEMAS, schemaForIndustry } from "@/lib/verticalSchemas";
import { money } from "@/lib/format";

/**
 * COMPARISON (spec section 7)
 *
 * The spec asks the comparison to "automatically choose relevant fields based
 * on the category" — healthcare exposing accreditation and facilities, fintech
 * exposing licences and funding. That's exactly the extension-schema mechanism
 * already driving the admin form and the profile, so comparison reuses it
 * rather than inventing a third list of what a vertical cares about.
 *
 * The rule: shared rows always render; a vertical's extra rows render only
 * when *every* selected company uses that schema. Comparing two hospitals
 * shows bed counts. Comparing a hospital against a law firm doesn't, because
 * "beds: 120 vs —" invites a comparison that isn't meaningful.
 */

export type CompareRow = {
  key: string;
  label: string;
  group: string;
  /** Rendered value per company, in the order given. */
  values: string[];
  /** True when the companies genuinely differ — used to power "differences only". */
  differs: boolean;
  /** Longer values wrap instead of truncating. */
  wide?: boolean;
};

const DASH = "—";

function list(value: unknown, limit = 6): string {
  if (!Array.isArray(value) || value.length === 0) return DASH;
  const items = value.filter((v) => typeof v === "string") as string[];
  if (!items.length) return DASH;
  return items.length > limit
    ? `${items.slice(0, limit).join(", ")} +${items.length - limit} more`
    : items.join(", ");
}

function text(value: unknown): string {
  if (value === null || value === undefined || value === "") return DASH;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function regionsOf(c: CompanyFull): string {
  const primary = c.regions.find((r) => r.isPrimary)?.region.name;
  const others = c.regions.filter((r) => !r.isPrimary).map((r) => r.region.name);
  if (!primary && !others.length) return DASH;
  return [primary, ...others].filter(Boolean).join(" · ");
}

function activityOf(c: CompanyFull): string {
  // A company that has never been checked shows nothing rather than a zero —
  // "0/100" and "not measured" mean very different things.
  if (c.activityScore === null || c.activityScore === undefined) return "Not checked";
  return `${c.activityScore}/100${c.activityLabel ? ` · ${c.activityLabel}` : ""}`;
}

function ratingOf(c: CompanyFull): string {
  if (!c.ratingScore || !c.ratingCount) return "No reviews yet";
  return `${c.ratingScore} (${c.ratingCount} review${c.ratingCount === 1 ? "" : "s"})`;
}

function verifiedFieldCount(c: CompanyFull): string {
  const total = c.fieldProvenance.length;
  if (!total) return "No sources recorded";
  const verified = c.fieldProvenance.filter((p) => p.verifiedAt).length;
  return `${verified} of ${total} field${total === 1 ? "" : "s"} verified`;
}

function investorsOf(c: CompanyFull): string {
  const names = Array.from(new Set(c.investors.map((i) => i.investor.name)));
  return list(names, 5);
}

function peopleOf(c: CompanyFull): string {
  const names = c.listingPeople.map((p) => p.person.name);
  return list(names, 4);
}

export function buildCompareRows(companies: CompanyFull[]): CompareRow[] {
  if (!companies.length) return [];

  const row = (
    key: string,
    label: string,
    group: string,
    fn: (c: CompanyFull) => string,
    wide = false,
  ): CompareRow => {
    const values = companies.map(fn);
    return {
      key,
      label,
      group,
      values,
      differs: new Set(values).size > 1,
      wide,
    };
  };

  const rows: CompareRow[] = [
    row("summary", "Summary", "Overview", (c) => c.shortDescription, true),
    row("industry", "Sector", "Overview", (c) =>
      c.industry.parent ? `${c.industry.parent.name} · ${c.industry.name}` : c.industry.name,
    ),
    row("founded", "Founded", "Overview", (c) => text(c.foundingYear ?? c.yearEstablished)),
    row("regions", "Regions", "Overview", regionsOf, true),
    row("city", "City", "Overview", (c) => text(c.city)),
    row("employees", "Employees", "Business", (c) => text(c.employeeRange)),
    row("model", "Business model", "Business", (c) => text(c.businessModel)),
    row("website", "Website", "Business", (c) => c.website),
    row("people", "Founders & leadership", "People", peopleOf, true),
    row("regulator", "Regulator", "Regulation", (c) => text(c.regulator)),
    row("registration", "Registration", "Regulation", (c) =>
      c.registrationNumber
        ? `${c.registrationNumber}${c.registrationBody ? ` (${c.registrationBody})` : ""}`
        : DASH,
    ),
    row("lifecycle", "Lifecycle", "Status", (c) => text(c.lifecycleStatus)),
    row("verification", "Listing verification", "Status", (c) => text(c.verification)),
    row("activity", "Website activity", "Status", activityOf),
    row("rating", "Rating", "Community", ratingOf),
    row("sources", "Evidence", "Community", verifiedFieldCount),
  ];

  // Vertical-specific rows, only when every company shares the schema.
  const schemas = companies.map((c) => schemaForIndustry(c.industry)?.key ?? null);
  const shared = schemas.every((k) => k !== null && k === schemas[0]) ? schemas[0] : null;

  if (shared && EXTENSION_SCHEMAS[shared]) {
    const schema = EXTENSION_SCHEMAS[shared];
    for (const field of schema.fields) {
      rows.push(
        row(field.column, field.label, schema.label, (c) => {
          const value = (c as unknown as Record<string, unknown>)[field.column];
          if (field.type === "list") return list(value);
          if (field.type === "currency") return typeof value === "number" ? money(value) : DASH;
          return text(value);
        }),
      );
    }

    if (shared === "fintech_schema") {
      rows.push(row("investors", "Investors", schema.label, investorsOf, true));
      rows.push(
        row("rounds", "Funding rounds", schema.label, (c) =>
          c.fundingRounds.length
            ? c.fundingRounds
                .slice()
                .sort((a, b) => (a.date > b.date ? -1 : 1))
                .map((r) => (r.amount ? `${r.round} (${money(r.amount)})` : r.round))
                .join(" · ")
            : DASH,
        ),
      );
    }
  }

  return rows;
}

/**
 * Why the vertical-specific block is or isn't showing. Surfaced in the UI so
 * a missing section reads as a deliberate decision rather than a bug.
 */
export function comparabilityNote(companies: CompanyFull[]): string | null {
  if (companies.length < 2) return null;
  const schemas = companies.map((c) => ({
    name: c.name,
    key: schemaForIndustry(c.industry)?.key ?? null,
    vertical: c.industry.parent?.name ?? c.industry.name,
  }));
  const first = schemas[0].key;
  if (schemas.every((s) => s.key === first)) {
    return first
      ? null
      : "These listings use base fields only, so there are no sector-specific rows to compare.";
  }
  const verticals = Array.from(new Set(schemas.map((s) => s.vertical)));
  return `You're comparing across ${verticals.join(" and ")}. Sector-specific rows (funding, bed capacity and the like) are hidden because they don't apply to every listing here.`;
}

export const MAX_COMPARE = 4;
