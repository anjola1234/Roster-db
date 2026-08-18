import type { Prisma } from "@/generated/prisma/client";

/**
 * WHAT DECIDES WHICH EXTRA FIELDS A LISTING GETS
 *
 * Previously this was decided by hardcoded slug checks scattered across the
 * codebase — `industry.slug === "fintech"` in the company page, `vertical ===
 * "healthcare"` in the admin form, and again in the directory table. Adding a
 * seventh vertical meant hunting all of them down, and adding a category under
 * an existing vertical silently got no extension fields at all.
 *
 * Now the database decides. `Industry.schemaExtension` names an entry in
 * EXTENSION_SCHEMAS below, and it is inherited from the parent vertical when a
 * category doesn't set its own. So:
 *
 *   - Adding a category that reuses fintech's fields  -> pure data change,
 *     set schemaExtension: "fintech_schema". No code.
 *   - Adding a vertical with no extra fields          -> pure data change,
 *     set "base only" or leave it null. No code.
 *   - Adding a vertical that needs genuinely NEW fields -> needs a migration
 *     (the columns are real columns on Company) plus one entry here. That
 *     limit is real and is documented in PROJECT_OVERVIEW section 4.
 *
 * The `column` on each field is the actual Company column it reads and writes,
 * which is what keeps this honest: nothing can be declared here that the
 * database can't store.
 */

export type FieldType = "text" | "number" | "currency" | "url" | "boolean" | "list" | "email";

export type ExtensionField = {
  /** The Company column this maps to. Must exist in schema.prisma. */
  column: string;
  label: string;
  type: FieldType;
  section: string;
  placeholder?: string;
  helpText?: string;
  /** Shown on the public company page's key-value panel. */
  showOnProfile?: boolean;
  min?: number;
  max?: number;
};

export type ExtensionSchema = {
  key: string;
  label: string;
  fields: ExtensionField[];
  /** Extra column in the directory table for listings using this schema. */
  tableColumn?: { column: string; label: string; format: "money" | "number" | "text" };
  /** Extra sort options offered when this schema is active. */
  sorts?: [string, string][];
  /** Overrides the generic label on the profile's address row. */
  addressLabel?: string;
  /** Label for the sub-category filter in the directory. */
  subCategoryLabel?: string;
};

export const EXTENSION_SCHEMAS: Record<string, ExtensionSchema> = {
  fintech_schema: {
    key: "fintech_schema",
    label: "Fintech details",
    addressLabel: "HQ",
    subCategoryLabel: "Sub-vertical",
    tableColumn: { column: "totalFunding", label: "Capital Raised", format: "money" },
    sorts: [["funding", "Most funded"]],
    fields: [
      {
        column: "totalFunding",
        label: "Total funding (USD)",
        type: "currency",
        section: "Funding & valuation",
        placeholder: "170000000",
        helpText: "Raw number, no commas or currency symbol.",
        showOnProfile: true,
      },
      {
        column: "valuation",
        label: "Valuation (USD)",
        type: "currency",
        section: "Funding & valuation",
        showOnProfile: true,
      },
      {
        column: "valuationDate",
        label: "Valuation date",
        type: "text",
        section: "Funding & valuation",
        placeholder: "2022-05",
      },
      {
        column: "licenses",
        label: "Licences",
        type: "list",
        section: "Regulation",
        placeholder: "Switching, PSSP, MMO",
        helpText: "Comma-separated.",
        showOnProfile: true,
      },
    ],
  },

  hospitals_schema: {
    key: "hospitals_schema",
    label: "Facility details",
    addressLabel: "Address",
    subCategoryLabel: "Type",
    tableColumn: { column: "bedCapacity", label: "Beds", format: "number" },
    sorts: [["beds", "Most beds"]],
    fields: [
      { column: "hospitalType", label: "Facility type", type: "text", section: "Location & type", placeholder: "Specialist, Teaching, General", showOnProfile: true },
      { column: "ownership", label: "Ownership", type: "text", section: "Location & type", placeholder: "Private, Federal, State", showOnProfile: true },
      { column: "yearEstablished", label: "Year established", type: "number", section: "Location & type", min: 1800, max: 2100 },
      { column: "address", label: "Address", type: "text", section: "Location & type" },
      { column: "bedCapacity", label: "Bed capacity", type: "number", section: "Clinical detail", min: 0, max: 100000, showOnProfile: true },
      { column: "emergency", label: "Emergency department", type: "boolean", section: "Clinical detail", showOnProfile: true },
      { column: "services", label: "Services", type: "list", section: "Clinical detail", placeholder: "Cardiology, Oncology, Maternity", helpText: "Comma-separated.", showOnProfile: true },
      { column: "accreditation", label: "Accreditations", type: "list", section: "Licence & accreditation", placeholder: "COHSASA, ISO 9001", helpText: "Comma-separated.", showOnProfile: true },
      { column: "accreditationBody", label: "Accrediting body", type: "text", section: "Licence & accreditation" },
      { column: "facilityBody", label: "Facility licence body", type: "text", section: "Licence & accreditation" },
      { column: "facilityNo", label: "Facility licence number", type: "text", section: "Licence & accreditation" },
      { column: "contactPhone", label: "Contact phone", type: "text", section: "Contact" },
      { column: "contactEmail", label: "Contact email", type: "email", section: "Contact" },
    ],
  },
};

/** Values of Industry.schemaExtension that mean "no extra fields". */
const NO_EXTENSION = new Set(["base only", "TBD", "", "none"]);

type IndustryLike = {
  slug: string;
  schemaExtension?: string | null;
  parent?: { slug: string; schemaExtension?: string | null } | null;
};

/**
 * Resolves which extension applies to an industry, inheriting from the parent
 * vertical when the category itself doesn't declare one. Returns null when the
 * listing uses base fields only — which is the correct default for every new
 * vertical, and why engineering/legal/education/science needed no code.
 */
export function schemaForIndustry(industry: IndustryLike | null | undefined): ExtensionSchema | null {
  if (!industry) return null;
  const declared = industry.schemaExtension ?? industry.parent?.schemaExtension ?? null;
  if (!declared || NO_EXTENSION.has(declared)) return null;
  return EXTENSION_SCHEMAS[declared] ?? null;
}

/** Reads an extension field off a company row without `any`. */
export function fieldValue(company: Record<string, unknown>, field: ExtensionField): unknown {
  return company[field.column];
}

/** True when a company has anything worth showing for this schema. */
export function hasExtensionData(company: Record<string, unknown>, schema: ExtensionSchema) {
  return schema.fields.some((f) => {
    const v = fieldValue(company, f);
    return v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
  });
}

/**
 * The FieldDefinition rows the seed writes, derived from the config above so
 * the database's self-description can't drift from what the app actually
 * renders. Previously FIELD_DEFINITIONS was maintained by hand and had already
 * drifted — it used snake_case keys that matched no real column.
 */
export function fieldDefinitionSeedRows(): {
  extensionKey: string;
  fieldKey: string;
  label: string;
  dataType: string;
  section: string | null;
  displayOrder: number;
  helpText: string | null;
}[] {
  const rows: ReturnType<typeof fieldDefinitionSeedRows> = [];
  for (const schema of Object.values(EXTENSION_SCHEMAS)) {
    schema.fields.forEach((f, i) => {
      rows.push({
        extensionKey: schema.key,
        fieldKey: f.column,
        label: f.label,
        dataType: f.type,
        section: f.section ?? null,
        displayOrder: i + 1,
        helpText: f.helpText ?? null,
      });
    });
  }
  return rows;
}

/** Industry selects need the parent's schemaExtension to resolve inheritance. */
export const industryWithSchemaSelect = {
  slug: true,
  name: true,
  schemaExtension: true,
  parent: { select: { slug: true, name: true, schemaExtension: true } },
} satisfies Prisma.IndustrySelect;
