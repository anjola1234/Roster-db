import { EXTENSION_SCHEMAS } from "@/lib/verticalSchemas";

/**
 * WHICH FIELDS CAN CARRY EVIDENCE
 *
 * Spec section 13 wants provenance on "every important data point". That's
 * only meaningful if the field keys are a controlled list — the seeded
 * FieldProvenance rows used ad-hoc snake_case keys (`total_funding_raised`,
 * `year_established`) that matched no actual Company column, so nothing could
 * ever join evidence back to the value it supported.
 *
 * The registry below is that controlled list. Base fields are declared here;
 * vertical-specific fields are pulled from EXTENSION_SCHEMAS so there is still
 * exactly one place that knows what fields exist.
 */

export type EvidenceField = { key: string; label: string; group: string };

const BASE_FIELDS: EvidenceField[] = [
  { key: "name", label: "Company name", group: "Identity" },
  { key: "website", label: "Website", group: "Identity" },
  { key: "foundingYear", label: "Founding year", group: "Identity" },
  { key: "shortDescription", label: "Short description", group: "Identity" },
  { key: "city", label: "City", group: "Location" },
  { key: "address", label: "Address", group: "Location" },
  { key: "employeeRange", label: "Employee range", group: "Business" },
  { key: "businessModel", label: "Business model", group: "Business" },
  { key: "regulator", label: "Regulator", group: "Regulation" },
  { key: "registrationBody", label: "Registration body", group: "Regulation" },
  { key: "registrationNumber", label: "Registration number", group: "Regulation" },
  { key: "lifecycleStatus", label: "Lifecycle status", group: "Status" },
  { key: "verification", label: "Verification status", group: "Status" },
];

/** Legacy snake_case keys from the original seed, mapped to real columns. */
export const LEGACY_KEY_ALIASES: Record<string, string> = {
  total_funding_raised: "totalFunding",
  founding_year: "foundingYear",
  year_established: "yearEstablished",
  bed_capacity: "bedCapacity",
  hospital_type: "hospitalType",
  contact_phone: "contactPhone",
  contact_email: "contactEmail",
  facility_license_no: "facilityNo",
  facility_license_body: "facilityBody",
  accreditation_body: "accreditationBody",
  license_type: "licenses",
  employee_count: "employeeRange",
  business_model: "businessModel",
  hq_address: "address",
};

/** Every field that can carry evidence, base plus all extension schemas. */
export function evidenceFields(): EvidenceField[] {
  const fields = [...BASE_FIELDS];
  for (const schema of Object.values(EXTENSION_SCHEMAS)) {
    for (const f of schema.fields) {
      if (fields.some((existing) => existing.key === f.column)) continue;
      fields.push({ key: f.column, label: f.label, group: schema.label });
    }
  }
  return fields;
}

const LABELS = new Map(evidenceFields().map((f) => [f.key, f.label]));

/**
 * Human label for a field key, tolerating the legacy keys and the
 * `funding_round:series_c` convention the seed used for round-level evidence.
 */
export function labelForFieldKey(key: string): string {
  if (LABELS.has(key)) return LABELS.get(key)!;
  const aliased = LEGACY_KEY_ALIASES[key];
  if (aliased && LABELS.has(aliased)) return LABELS.get(aliased)!;
  if (key.startsWith("funding_round:")) {
    const round = key.slice("funding_round:".length).replace(/_/g, " ");
    return `Funding round — ${round}`;
  }
  return key;
}

/** Freshness bands from spec section 19. */
export type Freshness = "fresh" | "aging" | "stale" | "very-stale" | "never";

export function freshnessOf(date: Date | null | undefined): Freshness {
  if (!date) return "never";
  const days = (Date.now() - new Date(date).getTime()) / 86_400_000;
  if (days < 30) return "fresh";
  if (days < 90) return "aging";
  if (days < 180) return "stale";
  return "very-stale";
}

export const FRESHNESS_LABELS: Record<Freshness, string> = {
  fresh: "Fresh (under 30 days)",
  aging: "Aging (30–90 days)",
  stale: "Stale (90–180 days)",
  "very-stale": "Very stale (over 180 days)",
  never: "Never verified",
};

/** Source kinds from the DataSource model, ordered most to least trusted. */
export const SOURCE_KIND_LABELS: Record<string, string> = {
  registry: "Government / regulator registry",
  official_api: "Official API",
  partner: "Partner data",
  rss: "News feed",
  scrape: "Website scrape",
  manual: "Manual research",
};
