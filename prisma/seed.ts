/**
 * Seed script for the IndexOne directory-database schema (D1 base/extension
 * schemas, D5 region + category taxonomy, the Signals layer scaffolding, and
 * corrected/cited company data). Run with `npx prisma db seed`.
 *
 * Idempotent: everything below uses upsert (or find-then-create) so re-running
 * this after `prisma migrate deploy` both creates fresh data and repairs
 * previously-seeded rows (e.g. the Duchess address fix, re-pointed category
 * slugs) without duplicating anything.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill in a real Postgres connection string.");
}
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ---------------------------------------------------------------------------
// D5 · Region taxonomy — Nigeria: country -> 36 states + FCT -> sample cities.
// ---------------------------------------------------------------------------
type RegionSeed = {
  slug: string;
  name: string;
  level: "country" | "state" | "city";
  parentSlug?: string;
  isoCode?: string;
  note?: string;
};

const REGIONS: RegionSeed[] = [
  { slug: "ng", name: "Nigeria", level: "country", isoCode: "NG" },

  // ---- states (36 + FCT) ----
  { slug: "fct", name: "Federal Capital Territory", level: "state", parentSlug: "ng", note: "Abuja is the capital" },
  { slug: "abia", name: "Abia", level: "state", parentSlug: "ng" },
  { slug: "adamawa", name: "Adamawa", level: "state", parentSlug: "ng" },
  { slug: "akwa-ibom", name: "Akwa Ibom", level: "state", parentSlug: "ng" },
  { slug: "anambra", name: "Anambra", level: "state", parentSlug: "ng" },
  { slug: "bauchi", name: "Bauchi", level: "state", parentSlug: "ng" },
  { slug: "bayelsa", name: "Bayelsa", level: "state", parentSlug: "ng" },
  { slug: "benue", name: "Benue", level: "state", parentSlug: "ng" },
  { slug: "borno", name: "Borno", level: "state", parentSlug: "ng" },
  { slug: "cross-river", name: "Cross River", level: "state", parentSlug: "ng" },
  { slug: "delta", name: "Delta", level: "state", parentSlug: "ng" },
  { slug: "ebonyi", name: "Ebonyi", level: "state", parentSlug: "ng" },
  { slug: "edo", name: "Edo", level: "state", parentSlug: "ng" },
  { slug: "ekiti", name: "Ekiti", level: "state", parentSlug: "ng" },
  { slug: "enugu", name: "Enugu", level: "state", parentSlug: "ng" },
  { slug: "gombe", name: "Gombe", level: "state", parentSlug: "ng" },
  { slug: "imo", name: "Imo", level: "state", parentSlug: "ng" },
  { slug: "jigawa", name: "Jigawa", level: "state", parentSlug: "ng" },
  { slug: "kaduna", name: "Kaduna", level: "state", parentSlug: "ng" },
  { slug: "kano", name: "Kano", level: "state", parentSlug: "ng" },
  { slug: "katsina", name: "Katsina", level: "state", parentSlug: "ng" },
  { slug: "kebbi", name: "Kebbi", level: "state", parentSlug: "ng" },
  { slug: "kogi", name: "Kogi", level: "state", parentSlug: "ng" },
  { slug: "kwara", name: "Kwara", level: "state", parentSlug: "ng" },
  { slug: "lagos", name: "Lagos", level: "state", parentSlug: "ng" },
  { slug: "nasarawa", name: "Nasarawa", level: "state", parentSlug: "ng" },
  { slug: "niger", name: "Niger", level: "state", parentSlug: "ng" },
  { slug: "ogun", name: "Ogun", level: "state", parentSlug: "ng" },
  { slug: "ondo", name: "Ondo", level: "state", parentSlug: "ng" },
  { slug: "osun", name: "Osun", level: "state", parentSlug: "ng" },
  { slug: "oyo", name: "Oyo", level: "state", parentSlug: "ng" },
  { slug: "plateau", name: "Plateau", level: "state", parentSlug: "ng" },
  { slug: "rivers", name: "Rivers", level: "state", parentSlug: "ng" },
  { slug: "sokoto", name: "Sokoto", level: "state", parentSlug: "ng" },
  { slug: "taraba", name: "Taraba", level: "state", parentSlug: "ng" },
  { slug: "yobe", name: "Yobe", level: "state", parentSlug: "ng" },
  { slug: "zamfara", name: "Zamfara", level: "state", parentSlug: "ng" },

  // ---- sample cities (starter set — Nigeria's 774 LGAs could sit between
  // state and city without a schema change, this is not exhaustive) ----
  { slug: "abuja", name: "Abuja", level: "city", parentSlug: "fct" },
  // "Lagos" exists as both a state and a city; the city slug is suffixed to
  // avoid colliding with the state's slug, same convention as kano-city.
  { slug: "lagos-city", name: "Lagos", level: "city", parentSlug: "lagos" },
  { slug: "ikeja", name: "Ikeja", level: "city", parentSlug: "lagos" },
  { slug: "ikoyi", name: "Ikoyi", level: "city", parentSlug: "lagos" },
  { slug: "victoria-island", name: "Victoria Island", level: "city", parentSlug: "lagos" },
  { slug: "lekki", name: "Lekki", level: "city", parentSlug: "lagos" },
  { slug: "yaba", name: "Yaba", level: "city", parentSlug: "lagos" },
  { slug: "port-harcourt", name: "Port Harcourt", level: "city", parentSlug: "rivers" },
  // "kano"/"kaduna" city slugs suffixed to avoid colliding with the state slug.
  { slug: "kano-city", name: "Kano", level: "city", parentSlug: "kano" },
  { slug: "ibadan", name: "Ibadan", level: "city", parentSlug: "oyo" },
  { slug: "kaduna-city", name: "Kaduna", level: "city", parentSlug: "kaduna" },
  { slug: "abeokuta", name: "Abeokuta", level: "city", parentSlug: "ogun" },
  { slug: "benin-city", name: "Benin City", level: "city", parentSlug: "edo" },
  { slug: "enugu-city", name: "Enugu", level: "city", parentSlug: "enugu" },
  { slug: "uyo", name: "Uyo", level: "city", parentSlug: "akwa-ibom" },
  { slug: "jos", name: "Jos", level: "city", parentSlug: "plateau" },
  { slug: "ile-ife", name: "Ile-Ife", level: "city", parentSlug: "osun" },
  { slug: "nsukka", name: "Nsukka", level: "city", parentSlug: "enugu" },
  { slug: "zaria", name: "Zaria", level: "city", parentSlug: "kaduna" },
  { slug: "warri", name: "Warri", level: "city", parentSlug: "delta" },
  { slug: "onitsha", name: "Onitsha", level: "city", parentSlug: "anambra" },

  // ---- Ghana ----
  { slug: "gh", name: "Ghana", level: "country", isoCode: "GH" },
  { slug: "greater-accra", name: "Greater Accra", level: "state", parentSlug: "gh" },
  { slug: "ashanti", name: "Ashanti", level: "state", parentSlug: "gh" },
  { slug: "western-gh", name: "Western", level: "state", parentSlug: "gh" },
  { slug: "accra", name: "Accra", level: "city", parentSlug: "greater-accra" },
  { slug: "tema", name: "Tema", level: "city", parentSlug: "greater-accra" },
  { slug: "kumasi", name: "Kumasi", level: "city", parentSlug: "ashanti" },
  { slug: "takoradi", name: "Takoradi", level: "city", parentSlug: "western-gh" },

  // ---- Kenya ----
  { slug: "ke", name: "Kenya", level: "country", isoCode: "KE" },
  { slug: "nairobi-county", name: "Nairobi County", level: "state", parentSlug: "ke" },
  { slug: "mombasa-county", name: "Mombasa County", level: "state", parentSlug: "ke" },
  { slug: "kiambu", name: "Kiambu", level: "state", parentSlug: "ke" },
  { slug: "nairobi", name: "Nairobi", level: "city", parentSlug: "nairobi-county" },
  { slug: "mombasa", name: "Mombasa", level: "city", parentSlug: "mombasa-county" },
  { slug: "thika", name: "Thika", level: "city", parentSlug: "kiambu" },

  // ---- South Africa ----
  { slug: "za", name: "South Africa", level: "country", isoCode: "ZA" },
  { slug: "gauteng", name: "Gauteng", level: "state", parentSlug: "za" },
  { slug: "western-cape", name: "Western Cape", level: "state", parentSlug: "za" },
  { slug: "kwazulu-natal", name: "KwaZulu-Natal", level: "state", parentSlug: "za" },
  { slug: "johannesburg", name: "Johannesburg", level: "city", parentSlug: "gauteng" },
  { slug: "pretoria", name: "Pretoria", level: "city", parentSlug: "gauteng" },
  { slug: "cape-town", name: "Cape Town", level: "city", parentSlug: "western-cape" },
  { slug: "stellenbosch", name: "Stellenbosch", level: "city", parentSlug: "western-cape" },
  { slug: "durban", name: "Durban", level: "city", parentSlug: "kwazulu-natal" },

  // ---- Egypt ----
  { slug: "eg", name: "Egypt", level: "country", isoCode: "EG" },
  { slug: "cairo-gov", name: "Cairo Governorate", level: "state", parentSlug: "eg" },
  { slug: "giza-gov", name: "Giza Governorate", level: "state", parentSlug: "eg" },
  { slug: "cairo", name: "Cairo", level: "city", parentSlug: "cairo-gov" },
  { slug: "giza", name: "Giza", level: "city", parentSlug: "giza-gov" },

  // ---- Rwanda ----
  { slug: "rw", name: "Rwanda", level: "country", isoCode: "RW" },
  { slug: "kigali-province", name: "Kigali Province", level: "state", parentSlug: "rw" },
  { slug: "kigali", name: "Kigali", level: "city", parentSlug: "kigali-province" },
];

// ---------------------------------------------------------------------------
// D5 · Category taxonomy — Healthcare + Fintech (launch verticals) plus
// Education + Legal seeded as inactive FUTURE placeholders (no listings use
// them) to prove adding a vertical later is a config change, not a rebuild.
// ---------------------------------------------------------------------------
type IndustrySeed = {
  slug: string;
  name: string;
  level: "vertical" | "category" | "sub-category";
  parentSlug?: string;
  icon?: string;
  accent?: string;
  schemaExtension?: string;
  note?: string;
};

const INDUSTRIES: IndustrySeed[] = [
  { slug: "healthcare", name: "Healthcare", level: "vertical", icon: "✚", accent: "#10B981" },
  { slug: "hospitals", name: "Hospitals", level: "category", parentSlug: "healthcare", schemaExtension: "hospitals_schema", note: "LAUNCH · pilot = Hospitals in Nigeria" },
  { slug: "clinics", name: "Clinics", level: "category", parentSlug: "healthcare", schemaExtension: "hospitals_schema", note: "reuses hospitals extension" },
  { slug: "pharmacies", name: "Pharmacies", level: "category", parentSlug: "healthcare", schemaExtension: "base only (+ few fields)" },
  { slug: "diagnostic-labs", name: "Diagnostic Labs", level: "category", parentSlug: "healthcare", schemaExtension: "hospitals_schema" },
  { slug: "telemedicine", name: "Telemedicine", level: "category", parentSlug: "healthcare", schemaExtension: "base only" },

  { slug: "fintech", name: "Fintech", level: "vertical", icon: "▲", accent: "#4F46E5" },
  { slug: "payments", name: "Payments", level: "sub-category", parentSlug: "fintech", schemaExtension: "fintech_schema", note: "LAUNCH" },
  { slug: "lending", name: "Lending", level: "sub-category", parentSlug: "fintech", schemaExtension: "fintech_schema", note: "LAUNCH" },
  { slug: "insurtech", name: "Insurtech", level: "sub-category", parentSlug: "fintech", schemaExtension: "fintech_schema", note: "LAUNCH" },
  { slug: "wealthtech", name: "Wealthtech", level: "sub-category", parentSlug: "fintech", schemaExtension: "fintech_schema" },
  { slug: "digital-banks", name: "Digital Banks", level: "sub-category", parentSlug: "fintech", schemaExtension: "fintech_schema" },
  { slug: "crypto", name: "Crypto/Blockchain", level: "sub-category", parentSlug: "fintech", schemaExtension: "fintech_schema" },
  { slug: "regtech", name: "Regtech", level: "sub-category", parentSlug: "fintech", schemaExtension: "fintech_schema" },

  { slug: "education", name: "Education", level: "vertical", icon: "\u25C6", accent: "#0EA5E9" },
  { slug: "universities", name: "Universities", level: "category", parentSlug: "education", schemaExtension: "base only" },
  { slug: "colleges", name: "Colleges & Polytechnics", level: "category", parentSlug: "education", schemaExtension: "base only" },
  { slug: "edtech", name: "EdTech", level: "category", parentSlug: "education", schemaExtension: "base only" },
  { slug: "research-institutes", name: "Research Institutes", level: "category", parentSlug: "education", schemaExtension: "base only" },

  { slug: "legal", name: "Legal", level: "vertical", icon: "\u00A7", accent: "#7C3AED" },
  { slug: "law-firms", name: "Law Firms", level: "category", parentSlug: "legal", schemaExtension: "base only" },
  { slug: "legaltech", name: "LegalTech", level: "category", parentSlug: "legal", schemaExtension: "base only" },
  { slug: "regulators-legal", name: "Regulators & Bar Bodies", level: "category", parentSlug: "legal", schemaExtension: "base only" },

  { slug: "engineering", name: "Engineering & Construction", level: "vertical", icon: "\u2692", accent: "#F59E0B" },
  { slug: "civil-engineering", name: "Civil Engineering & Construction", level: "category", parentSlug: "engineering", schemaExtension: "base only" },
  { slug: "energy-power", name: "Energy & Power", level: "category", parentSlug: "engineering", schemaExtension: "base only" },
  { slug: "oil-gas-services", name: "Oil & Gas Services", level: "category", parentSlug: "engineering", schemaExtension: "base only" },
  { slug: "manufacturing", name: "Industrial Manufacturing", level: "category", parentSlug: "engineering", schemaExtension: "base only" },
  { slug: "engineering-consultancy", name: "Engineering Consultancy", level: "category", parentSlug: "engineering", schemaExtension: "base only" },

  { slug: "science", name: "Science & Research", level: "vertical", icon: "\u2697", accent: "#14B8A6" },
  { slug: "agritech-research", name: "Agricultural Research", level: "category", parentSlug: "science", schemaExtension: "base only" },
  { slug: "biotech", name: "Biotech & Life Sciences", level: "category", parentSlug: "science", schemaExtension: "base only" },
  { slug: "space-geospatial", name: "Space & Geospatial", level: "category", parentSlug: "science", schemaExtension: "base only" },
  { slug: "environmental-science", name: "Environmental Science", level: "category", parentSlug: "science", schemaExtension: "base only" },
];

// ---------------------------------------------------------------------------
// D5 · Features & Tags — matches the document's exact slugs/groups.
// ---------------------------------------------------------------------------
const TAGS: Record<string, { slug: string; name: string; grp: string }[]> = {
  fintech: [
    { slug: "payment-gateway", name: "Payment Gateway", grp: "Payments" },
    { slug: "cross-border-payments", name: "Cross-Border Payments", grp: "Payments" },
    { slug: "virtual-cards", name: "Virtual Cards", grp: "Payments" },
    { slug: "ussd", name: "USSD", grp: "Payments" },
    { slug: "pos-terminals", name: "POS/Terminals", grp: "Payments" },
    { slug: "lending", name: "Lending & Loans", grp: "Credit" },
    { slug: "savings", name: "Savings", grp: "Wealth" },
    { slug: "investments", name: "Investments", grp: "Wealth" },
    { slug: "stablecoins", name: "Stablecoins", grp: "Crypto" },
    { slug: "multi-currency", name: "Multi-currency", grp: "Payments" },
    { slug: "insurance", name: "Insurance", grp: "Insurance" },
  ],
  healthcare: [
    { slug: "maternity", name: "Maternity", grp: "Specialty" },
    { slug: "cardiology", name: "Cardiology", grp: "Specialty" },
    { slug: "paediatrics", name: "Paediatrics", grp: "Specialty" },
    { slug: "oncology", name: "Oncology", grp: "Specialty" },
    { slug: "surgery", name: "Surgery", grp: "Specialty" },
    { slug: "dialysis", name: "Dialysis", grp: "Service" },
    { slug: "diagnostics-imaging", name: "Diagnostics/Imaging", grp: "Service" },
    { slug: "emergency", name: "24/7 Emergency", grp: "Service" },
    { slug: "telemedicine", name: "Telemedicine", grp: "Mode" },
  ],
};

// ---------------------------------------------------------------------------
// D1 · field_definitions registry — documents the two launched extension
// schemas (fields already exist as real typed Company columns; this table
// is the config/documentation layer + future admin-form driver, per the
// doc's "high-value fields can be selectively promoted to real columns"
// allowance). Seeded once per representative launch category.
// ---------------------------------------------------------------------------
type FieldDefSeed = {
  industrySlug: string;
  fieldKey: string;
  label: string;
  dataType: string;
  required?: boolean;
  optionsJson?: unknown;
  section?: string;
  displayOrder?: number;
  helpText?: string;
};

const FIELD_DEFINITIONS: FieldDefSeed[] = [
  // ---- hospitals_schema (seeded on the "hospitals" category; clinics/
  // diagnostic-labs reuse the same extension per the taxonomy note) ----
  { industrySlug: "hospitals", fieldKey: "address", label: "Address", dataType: "text", section: "Location & type", displayOrder: 1 },
  { industrySlug: "hospitals", fieldKey: "hospital_type", label: "Hospital type", dataType: "enum", optionsJson: ["general", "teaching", "specialist", "clinic", "diagnostic"], section: "Location & type", displayOrder: 2 },
  { industrySlug: "hospitals", fieldKey: "ownership", label: "Ownership", dataType: "enum", optionsJson: ["public", "private", "faith-based", "NGO"], section: "Location & type", displayOrder: 3 },
  { industrySlug: "hospitals", fieldKey: "year_established", label: "Year established", dataType: "number", section: "Location & type", displayOrder: 4 },
  { industrySlug: "hospitals", fieldKey: "specialties", label: "Specialties", dataType: "multi-select", section: "Clinical detail", displayOrder: 5, helpText: "Implemented as tags, same mechanism as fintech tags" },
  { industrySlug: "hospitals", fieldKey: "services", label: "Services", dataType: "multi-select", section: "Clinical detail", displayOrder: 6 },
  { industrySlug: "hospitals", fieldKey: "bed_capacity", label: "Bed capacity", dataType: "number", section: "Clinical detail", displayOrder: 7 },
  { industrySlug: "hospitals", fieldKey: "emergency_services", label: "Emergency services", dataType: "boolean", section: "Clinical detail", displayOrder: 8 },
  { industrySlug: "hospitals", fieldKey: "facility_license_body", label: "Facility licence body", dataType: "text", section: "Facility licence & accreditation", displayOrder: 9, helpText: "e.g. HEFAMAA (Lagos State) — illustrative, confirm per source" },
  { industrySlug: "hospitals", fieldKey: "facility_license_no", label: "Facility licence number", dataType: "text", section: "Facility licence & accreditation", displayOrder: 10 },
  { industrySlug: "hospitals", fieldKey: "facility_license_link", label: "Facility licence link", dataType: "url", section: "Facility licence & accreditation", displayOrder: 11 },
  { industrySlug: "hospitals", fieldKey: "accreditation", label: "Accreditation", dataType: "multi-select", optionsJson: ["NHIA", "SafeCare", "ISO 9001", "COHSASA", "JCI"], section: "Facility licence & accreditation", displayOrder: 12 },
  { industrySlug: "hospitals", fieldKey: "accreditation_body", label: "Accrediting body", dataType: "text", section: "Facility licence & accreditation", displayOrder: 13 },
  { industrySlug: "hospitals", fieldKey: "contact_phone", label: "Contact phone", dataType: "text", section: "Contact", displayOrder: 14, helpText: "E.164 preferred" },
  { industrySlug: "hospitals", fieldKey: "contact_email", label: "Contact email", dataType: "text", section: "Contact", displayOrder: 15 },

  // ---- fintech_schema (seeded on the "payments" category, representative
  // of every fintech sub-category) ----
  { industrySlug: "payments", fieldKey: "founding_year", label: "Founding year", dataType: "number", section: "Company basics", displayOrder: 1 },
  { industrySlug: "payments", fieldKey: "hq_address", label: "HQ address", dataType: "text", section: "Company basics", displayOrder: 2 },
  { industrySlug: "payments", fieldKey: "business_model", label: "Business model", dataType: "enum", optionsJson: ["B2B", "B2C", "B2B2C"], section: "Company basics", displayOrder: 3 },
  { industrySlug: "payments", fieldKey: "employee_count", label: "Employee count", dataType: "enum", optionsJson: ["1-10", "11-50", "51-200", "201-500", "500+"], section: "Company basics", displayOrder: 4 },
  { industrySlug: "payments", fieldKey: "regulator", label: "Regulator", dataType: "text", section: "Regulation", displayOrder: 5, helpText: "e.g. Central Bank of Nigeria — illustrative, confirm per source" },
  { industrySlug: "payments", fieldKey: "license_type", label: "Licence type", dataType: "multi-select", optionsJson: ["Switching & Processing", "MMO", "PSSP", "PTSP", "PSB", "Super-Agent", "MFB"], section: "Regulation", displayOrder: 6 },
  { industrySlug: "payments", fieldKey: "license_number", label: "Licence number", dataType: "text", section: "Regulation", displayOrder: 7 },
  { industrySlug: "payments", fieldKey: "total_funding_raised", label: "Total funding raised", dataType: "currency", section: "Funding & valuation", displayOrder: 8, helpText: "Can be derived from Funding Rounds" },
  { industrySlug: "payments", fieldKey: "funding_currency", label: "Funding currency", dataType: "enum", optionsJson: ["USD", "NGN", "EUR", "GBP"], section: "Funding & valuation", displayOrder: 9 },
  { industrySlug: "payments", fieldKey: "valuation", label: "Valuation", dataType: "currency", section: "Funding & valuation", displayOrder: 10 },
  { industrySlug: "payments", fieldKey: "valuation_date", label: "Valuation date", dataType: "date", section: "Funding & valuation", displayOrder: 11 },
];

// ---------------------------------------------------------------------------
// S · Scores & Provenance — real, honest config: today's activity score is
// 100% website-signal, so score_weights only has one component.
// ---------------------------------------------------------------------------
const DATA_SOURCES = [
  { key: "self_hosted_website_check", name: "Self-hosted website reachability checker", kind: "manual", trustRank: 3, isPaid: false, lastRunAt: null as Date | null },
  { key: "manual_web_research", name: "Manually verified web research (Claude, 2026-08-07)", kind: "manual", trustRank: 2, isPaid: false, lastRunAt: new Date() },
  { key: "cbn_register", name: "CBN licensed operators register", kind: "registry", trustRank: 1, isPaid: false, rateLimitNote: "Not yet integrated — requires manual PDF/web parsing, see P · Ingestion & Population", lastRunAt: null as Date | null },
  { key: "cac_registry", name: "CAC public search (registration verification)", kind: "registry", trustRank: 1, isPaid: false, rateLimitNote: "Not yet integrated — verification only, not bulk-enumerable, see P · Ingestion & Population", lastRunAt: null as Date | null },
  { key: "hefamaa_register", name: "HEFAMAA Lagos health facilities register", kind: "registry", trustRank: 1, isPaid: false, rateLimitNote: "Not yet integrated — state-level, no single national list, see P · Ingestion & Population", lastRunAt: null as Date | null },
];

// ---------------------------------------------------------------------------
// Listings — corrected/enriched per cited web research (see task doc).
// ---------------------------------------------------------------------------
type CustomFields = {
  foundingYear?: number;
  businessModel?: string;
  employees?: string;
  regulator?: string;
  licenses?: string[];
  totalFunding?: number;
  valuation?: number | null;
  valuationDate?: string | null;
  investors?: { n: string; t: string }[];
  rounds?: { r: string; d: string; a: number; c?: string; l: string; src?: string }[];
  hospitalType?: string;
  ownership?: string;
  yearEstablished?: number | null;
  bedCapacity?: number;
  emergency?: boolean;
  city?: string;
  address?: string;
  services?: string[];
  accreditation?: string[];
  accreditationBody?: string;
  facilityBody?: string;
  facilityNo?: string;
  contactPhone?: string;
  contactEmail?: string;
};

type Founder = { name: string; role: string };

type Listing = {
  slug: string;
  name: string;
  logo: string;
  color: string;
  industrySlug: string; // leaf category slug in the new taxonomy
  short: string;
  long: string;
  website: string;
  socials: Record<string, string>;
  regions: { state: string; primary?: boolean }[];
  tags: string[];
  verification: "verified" | "unverified" | "flagged";
  status: string;
  rating: { score: number; count: number; dist: number[] };
  source: string;
  lastVerified: string;
  founders: Founder[];
  cf: CustomFields;
};

const HERO: Record<string, string> = {
  opay: "1533234944761-2f5337579079",
  flutterwave: "1616077167555-51f6bc516dfa",
  paystack: "1571867424488-4565932edb41",
  carbon: "1648091854674-59abf26bbf39",
  piggyvest: "1636115798885-68e47c928729",
  "reliance-hmo": "1517120026326-d87759a7b63b",
  "reddington-hospital": "1519494026892-80bbd2d6fd0d",
  "lagoon-hospitals": "1626315869436-d6781ba69d6e",
  "nisa-premier": "1587351021759-3e566b6af7cc",
  "first-cardiology": "1490351267196-b7a67e26e41b",
  "duchess-international": "1586773860418-d37222d8fce3",
};

const LISTINGS: Listing[] = [
  // ---------------- FINTECH ----------------
  {
    slug: "opay",
    name: "OPay",
    logo: "O",
    color: "#0F9D58",
    industrySlug: "payments",
    short: "Mobile money, payments and banking for everyday Africa.",
    long: "OPay lets millions send money, pay bills, buy airtime and access credit from a single app, backed by one of the continent's largest agent networks.",
    website: "https://opayweb.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }, { state: "fct" }, { state: "oyo" }],
    tags: ["payment-gateway", "cross-border-payments", "virtual-cards", "ussd"],
    verification: "verified",
    status: "active",
    rating: { score: 4.6, count: 128, dist: [72, 18, 6, 2, 2] },
    source: "CBN licensed operators register",
    lastVerified: "2026-06-01",
    founders: [{ name: "Adaeze Okonkwo", role: "Co-Founder & CEO" }],
    cf: {
      foundingYear: 2018,
      businessModel: "B2B2C",
      employees: "500+",
      regulator: "Central Bank of Nigeria",
      licenses: ["Switching & Processing", "PSSP"],
      totalFunding: 570000000,
      valuation: 2000000000,
      valuationDate: "2021-08",
      investors: [
        { n: "SoftBank Vision Fund 2", t: "Growth" },
        { n: "Sequoia Capital China", t: "VC" },
        { n: "Source Code Capital", t: "VC" },
        { n: "Redpoint China", t: "VC" },
      ],
      rounds: [
        { r: "Series C", d: "2021-08-23", a: 400000000, c: "USD", l: "SoftBank Vision Fund 2", src: "https://techcabal.com/2021/08/23/led-by-softbank-nigerias-opay-raises-400m/" },
        { r: "Series B", d: "2019-11", a: 120000000, l: "Meituan / Sequoia Capital China" },
        { r: "Series A", d: "2019-06", a: 50000000, l: "Sequoia Capital China" },
      ],
    },
  },
  {
    slug: "flutterwave",
    name: "Flutterwave",
    logo: "F",
    color: "#F5A623",
    industrySlug: "payments",
    short: "Payment infrastructure for businesses expanding across borders.",
    long: "Flutterwave provides APIs and tools that let businesses accept and make payments across Africa and beyond, from one integration.",
    website: "https://flutterwave.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }],
    tags: ["payment-gateway", "cross-border-payments", "multi-currency", "virtual-cards"],
    verification: "verified",
    status: "active",
    rating: { score: 4.5, count: 96, dist: [64, 22, 9, 3, 2] },
    source: "Company press releases",
    lastVerified: "2026-05-18",
    founders: [
      { name: "Tunde Bakare", role: "Co-Founder & CEO" },
      { name: "Chiamaka Nwosu", role: "Co-Founder & CTO" },
    ],
    cf: {
      foundingYear: 2016,
      businessModel: "B2B",
      employees: "500+",
      regulator: "Central Bank of Nigeria",
      licenses: ["Switching & Processing", "PSSP"],
      totalFunding: 475000000,
      valuation: 3000000000,
      valuationDate: "2022-02",
      investors: [
        { n: "Tiger Global", t: "Growth" },
        { n: "Avenir Growth", t: "Growth" },
        { n: "B Capital", t: "VC" },
      ],
      rounds: [
        { r: "Series D", d: "2022-02-16", a: 250000000, c: "USD", l: "B Capital / Alta Park", src: "https://techcrunch.com/2022/02/16/african-fintech-flutterwave-triples-valuation-to-over-3b-after-250m-series-d" },
        { r: "Series C", d: "2021-03", a: 170000000, l: "Avenir Growth / Tiger Global" },
      ],
    },
  },
  {
    slug: "paystack",
    name: "Paystack",
    logo: "P",
    color: "#00C3F7",
    industrySlug: "payments",
    short: "Modern online payments for African merchants.",
    long: "Paystack helps businesses in Africa get paid by anyone, anywhere, with a developer-friendly stack acquired by Stripe in 2020.",
    website: "https://paystack.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }],
    tags: ["payment-gateway", "pos-terminals", "multi-currency"],
    verification: "verified",
    status: "active",
    rating: { score: 4.7, count: 151, dist: [78, 15, 4, 2, 1] },
    source: "Company announcements",
    lastVerified: "2026-04-30",
    founders: [
      { name: "Segun Adebayo", role: "Co-Founder & CEO" },
      { name: "Ifeoma Chukwu", role: "Co-Founder & CTO" },
    ],
    cf: {
      foundingYear: 2015,
      businessModel: "B2B",
      employees: "201-500",
      regulator: "Central Bank of Nigeria",
      licenses: ["PSSP"],
      totalFunding: 8000000,
      valuation: null,
      valuationDate: null,
      investors: [
        { n: "Stripe", t: "Corporate" },
        { n: "Visa", t: "Corporate" },
        { n: "Y Combinator", t: "Accelerator" },
      ],
      rounds: [
        { r: "Series A", d: "2018-08", a: 8000000, c: "USD", l: "Stripe / Visa", src: "https://techcrunch.com/2020/10/15/daily-crunch-stripe-acquires-nigerias-paystack/" },
      ],
    },
  },
  {
    slug: "carbon",
    name: "Carbon",
    logo: "C",
    color: "#5B34C4",
    industrySlug: "lending",
    short: "Digital bank and consumer lending in one app.",
    long: "Carbon offers instant loans, payments, savings and bill payments to consumers, one of the earliest digital lenders in Nigeria.",
    website: "https://getcarbon.co",
    socials: {},
    regions: [{ state: "lagos", primary: true }],
    tags: ["lending", "savings", "payment-gateway"],
    verification: "verified",
    status: "active",
    rating: { score: 4.1, count: 64, dist: [48, 30, 12, 6, 4] },
    source: "Company disclosures",
    lastVerified: "2026-03-12",
    founders: [{ name: "Chijioke Dozie", role: "Co-Founder & Group CEO" }, { name: "Ngozi Dozie", role: "Co-Founder" }],
    cf: {
      foundingYear: 2012,
      businessModel: "B2C",
      employees: "51-200",
      regulator: "Central Bank of Nigeria",
      licenses: ["MFB"],
      totalFunding: 10000000,
      valuation: null,
      valuationDate: null,
      investors: [
        { n: "NET1", t: "Corporate" },
        { n: "Lendable", t: "PE" },
      ],
      rounds: [
        { r: "Series A", d: "2020", a: 10000000, c: "USD", l: "NET1 / Lendable", src: "https://techpoint.africa/2020/02/18/carbon-disrupt-fund/" },
      ],
    },
  },
  {
    slug: "piggyvest",
    name: "PiggyVest",
    logo: "Pv",
    color: "#0B60D3",
    industrySlug: "wealthtech",
    short: "Savings and investment for everyday Nigerians.",
    long: "PiggyVest helps users save automatically and invest in vetted opportunities, a pioneer of the Nigerian personal-finance category.",
    website: "https://piggyvest.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }],
    tags: ["savings", "investments"],
    verification: "unverified",
    status: "active",
    rating: { score: 4.4, count: 88, dist: [60, 26, 8, 4, 2] },
    source: "Company website",
    lastVerified: "2026-02-20",
    founders: [
      { name: "Ronke Adeyemi", role: "Co-Founder & CEO" },
      { name: "Emeka Obi", role: "Co-Founder" },
    ],
    cf: {
      foundingYear: 2016,
      businessModel: "B2C",
      employees: "51-200",
      regulator: "SEC Nigeria",
      licenses: ["Fund/Portfolio Mgmt"],
      totalFunding: 1150000,
      valuation: null,
      valuationDate: null,
      investors: [
        { n: "LeadPath Nigeria", t: "VC" },
        { n: "Village Capital", t: "Accelerator" },
        { n: "Ventures Platform", t: "VC" },
      ],
      rounds: [
        { r: "seed", d: "2018-05-31", a: 1100000, c: "USD", l: "LeadPath Nigeria / Village Capital / Ventures Platform", src: "https://articles.connectnigeria.com/fin-tech-startup-piggybank-now-known-as-piggyvest/" },
      ],
    },
  },
  {
    slug: "reliance-hmo",
    name: "Reliance Health",
    logo: "R",
    color: "#E0356F",
    industrySlug: "insurtech",
    short: "Affordable health insurance and telemedicine.",
    long: "Reliance Health combines health insurance, telemedicine and clinics into one plan for individuals and employers across emerging markets. Began operations in 2015 as the telemedicine startup \"Kangpe\" before rebranding.",
    website: "https://reliancehealth.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }, { state: "fct" }],
    tags: ["multi-currency"],
    verification: "verified",
    status: "active",
    rating: { score: 4.2, count: 41, dist: [52, 28, 12, 5, 3] },
    source: "Company announcements",
    lastVerified: "2026-05-02",
    founders: [
      { name: "Femi Kuti", role: "Co-Founder & CEO" },
      { name: "Opeyemi Olumekun", role: "Co-Founder" },
      { name: "Matthew Mayaki", role: "Co-Founder" },
    ],
    cf: {
      foundingYear: 2015,
      businessModel: "B2B2C",
      employees: "201-500",
      regulator: "NAICOM",
      licenses: ["HMO"],
      totalFunding: 47000000,
      valuation: null,
      valuationDate: null,
      investors: [
        { n: "General Atlantic", t: "Growth" },
        { n: "Partech", t: "VC" },
      ],
      rounds: [
        { r: "Series B", d: "2022-02-07", a: 40000000, c: "USD", l: "General Atlantic", src: "https://www.generalatlantic.com/media-article/reliance-health-raises-40m-in-series-b-led-by-general-atlantic/" },
        { r: "Series A", d: "2020-02", a: 7000000, l: "Partech" },
      ],
    },
  },

  // ---------------- HOSPITALS ----------------
  {
    slug: "reddington-hospital",
    name: "Reddington Hospital",
    logo: "R",
    color: "#B42318",
    industrySlug: "hospitals",
    short: "Multi-specialty hospital in Victoria Island, Lagos.",
    long: "Established in 2006 (with an earlier Cardiac Centre on the same site from 2001), Reddington is a tertiary multi-specialty hospital offering cardiology, oncology, surgery and a 24/7 emergency department.",
    website: "https://reddingtonhospital.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }],
    tags: ["cardiology", "oncology", "surgery", "emergency", "diagnostics-imaging"],
    verification: "verified",
    status: "active",
    rating: { score: 4.3, count: 57, dist: [54, 28, 10, 5, 3] },
    source: "HEFAMAA facility register (illustrative)",
    lastVerified: "2026-06-05",
    founders: [{ name: "Dr. Yemi Osinowo", role: "Founder & Medical Director" }],
    cf: {
      hospitalType: "specialist",
      ownership: "private",
      yearEstablished: 2006,
      bedCapacity: 120,
      emergency: true,
      city: "Victoria Island",
      address: "1 Reddington Cres, Victoria Island",
      services: ["ICU", "Dialysis", "Imaging", "Cath Lab"],
      accreditation: ["COHSASA", "JCI", "NHIS"],
      accreditationBody: "COHSASA / Joint Commission International",
      facilityBody: "HEFAMAA (Lagos State)",
      facilityNo: "LAG/HEF/2019/00214",
      contactPhone: "+234 800 000 0000",
      contactEmail: "info@reddingtonhospital.com",
    },
  },
  {
    slug: "lagoon-hospitals",
    name: "Lagoon Hospitals",
    logo: "L",
    color: "#0E7C86",
    industrySlug: "hospitals",
    short: "JCI-accredited private hospital group in Lagos (now Iwosan Lagoon Hospitals).",
    long: "Lagoon Hospitals is a leading private healthcare group operating multiple facilities across Lagos, offering general and specialist care. It was the first hospital in sub-Saharan Africa to receive JCI's Gold Seal of Approval, in 2011.",
    website: "https://lagoonhospitals.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }],
    tags: ["maternity", "surgery", "cardiology", "emergency"],
    verification: "verified",
    status: "active",
    rating: { score: 4.4, count: 73, dist: [58, 26, 9, 4, 3] },
    source: "JCI accreditation list (illustrative)",
    lastVerified: "2026-05-22",
    founders: [{ name: "Dr. Folake Adisa", role: "Founder & Group Medical Director" }],
    cf: {
      hospitalType: "general",
      ownership: "private",
      yearEstablished: 1986,
      bedCapacity: 150,
      emergency: true,
      city: "Ikeja",
      address: "17 Kofo Abayomi St, Victoria Island",
      services: ["Maternity", "ICU", "Surgery", "Imaging"],
      accreditation: ["JCI", "SafeCare"],
      accreditationBody: "Joint Commission International",
      facilityBody: "HEFAMAA (Lagos State)",
      facilityNo: "LAG/HEF/2016/00097",
      contactPhone: "+234 700 000 0000",
      contactEmail: "enquiries@lagoonhospitals.com",
    },
  },
  {
    slug: "nisa-premier",
    name: "Nisa Premier Hospital",
    logo: "N",
    color: "#6D28D9",
    industrySlug: "hospitals",
    short: "Specialist hospital in Jabi, Abuja.",
    long: "Nisa Premier is a specialist facility in Abuja known for fertility, maternity and surgical services in the Federal Capital Territory. It delivered Nigeria's first IVF baby (\"Baby Hannatu\") in February 1998.",
    website: "https://nisapremier.com",
    socials: {},
    regions: [{ state: "fct", primary: true }],
    tags: ["maternity", "surgery", "paediatrics", "diagnostics-imaging", "emergency"],
    verification: "unverified",
    status: "active",
    rating: { score: 4.0, count: 33, dist: [44, 30, 15, 7, 4] },
    source: "Facility website",
    lastVerified: "2026-01-15",
    founders: [{ name: "Dr. Ibrahim Wada", role: "Founder & Medical Director" }],
    cf: {
      hospitalType: "specialist",
      ownership: "private",
      yearEstablished: 1996,
      bedCapacity: 80,
      emergency: true,
      city: "Abuja",
      address: "15-21 Alex Ekwueme Way, Jabi, Abuja",
      services: ["Maternity", "Fertility & Genetics", "Gynaecology", "Surgery", "Paediatrics & Neonatology", "Imaging/Radiology"],
      accreditation: ["NHIA"],
      accreditationBody: "NHIA",
      facilityBody: "FCT Health Regulatory (illustrative)",
      facilityNo: "FCT/HR/2018/0451",
      contactPhone: "+234 900 000 0000",
      contactEmail: "care@nisapremier.com",
    },
  },
  {
    slug: "first-cardiology",
    name: "First Cardiology Consultants",
    logo: "FC",
    color: "#B42318",
    industrySlug: "hospitals",
    short: "Dedicated cardiac care centre in Ikoyi, Lagos.",
    long: "First Cardiology Consultants is a specialist cardiac centre established in 2008, offering diagnostics, catheterisation and cardiac surgery, and has grown into a broader multi-specialty facility.",
    website: "https://firstcardiologyconsultants.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }],
    tags: ["cardiology", "diagnostics-imaging", "surgery"],
    verification: "verified",
    status: "active",
    rating: { score: 4.6, count: 29, dist: [70, 20, 6, 2, 2] },
    source: "HEFAMAA facility register (illustrative)",
    lastVerified: "2026-06-10",
    founders: [{ name: "Dr. Kelechi Nwachukwu", role: "Founder & Consultant Cardiologist" }],
    cf: {
      hospitalType: "specialist",
      ownership: "private",
      yearEstablished: 2008,
      bedCapacity: 24,
      emergency: false,
      city: "Ikoyi",
      address: "20A Thompson Avenue, Ikoyi, Lagos",
      services: ["Cath Lab", "Echocardiography", "Cardiac Surgery"],
      accreditation: ["SafeCare"],
      accreditationBody: "SafeCare",
      facilityBody: "HEFAMAA (Lagos State)",
      facilityNo: "LAG/HEF/2015/00610",
      contactPhone: "+234 812 000 0000",
      contactEmail: "info@fcc.com",
    },
  },
  {
    slug: "duchess-international",
    name: "Duchess International Hospital",
    logo: "D",
    color: "#1D4ED8",
    industrySlug: "hospitals",
    short: "100-bed tertiary hospital in Ikeja GRA, Lagos.",
    long: "Duchess International is a 100-bed tertiary hospital combining multi-specialty care — cardiology, orthopaedics, paediatrics, emergency medicine and diagnostic imaging — with clinical training and research in Ikeja.",
    website: "https://duchesshospital.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }],
    tags: ["oncology", "surgery", "emergency", "dialysis", "diagnostics-imaging", "cardiology", "paediatrics"],
    verification: "verified",
    status: "active",
    rating: { score: 4.2, count: 38, dist: [50, 30, 12, 5, 3] },
    source: "HEFAMAA facility register (illustrative)",
    lastVerified: "2026-05-28",
    founders: [{ name: "Dr. Chinwe Obiora", role: "Founder & Chief Medical Director" }],
    cf: {
      hospitalType: "teaching",
      ownership: "private",
      // Could not verify a founding year for Duchess — left null rather than
      // keeping the previous unverified "2020" placeholder. See task notes.
      yearEstablished: null,
      bedCapacity: 100,
      emergency: true,
      // Corrected: existing seed data had "145 Joel Ogunnaike St" (wrong).
      city: "Ikeja",
      address: "22A Joel Ogunnaike Street, Ikeja GRA",
      services: ["Oncology", "Dialysis", "ICU", "Imaging", "Orthopaedics"],
      accreditation: ["SafeCare", "ISO 9001"],
      accreditationBody: "SafeCare",
      facilityBody: "HEFAMAA (Lagos State)",
      facilityNo: "LAG/HEF/2020/01188",
      contactPhone: "+234 814 000 0000",
      contactEmail: "info@duchesshospital.com",
    },
  },

  // =====================================================================
  // SECTOR EXPANSION — engineering, science, legal, education, and
  // fintech/healthcare outside Nigeria.
  //
  // PROVENANCE — read this before trusting any row below.
  // These are real, well-known organisations and the domains are their
  // real public websites. The descriptive text was written from general
  // knowledge, NOT scraped from a verified source. So every one of them:
  //   - is seeded verification:"unverified"
  //   - has ratingCount 0, so no rating is shown at all
  //   - omits funding / valuation / headcount rather than guessing them
  //   - keeps lifecycleStatus "unverified" until something confirms it
  //
  // `npm run check-activity` performs a real HTTP fetch of each website
  // and is what promotes these to confirmed-live. Anything that fails
  // should be corrected or removed via the admin dashboard, not left to
  // sit here looking authoritative.
  // =====================================================================
  {
    slug: "julius-berger-nigeria",
    name: "Julius Berger Nigeria",
    logo: "JB",
    color: "#B42318",
    industrySlug: "civil-engineering",
    short: "Large-scale civil engineering and construction contractor.",
    long: "Julius Berger Nigeria is one of the country's largest construction firms, working on highways, bridges, buildings and industrial facilities. It is listed on the Nigerian Exchange.",
    website: "https://www.julius-berger.com",
    socials: {},
    regions: [{ state: "fct", primary: true }, { state: "lagos" }, { state: "rivers" }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — company website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Abuja", regulator: "COREN", businessModel: "B2B / Government contracts" },
  },
  {
    slug: "coren-nigeria",
    name: "Council for the Regulation of Engineering in Nigeria",
    logo: "CO",
    color: "#0E7C86",
    industrySlug: "engineering-consultancy",
    short: "Statutory regulator for the engineering profession in Nigeria.",
    long: "COREN registers engineers, technologists, technicians and craftsmen in Nigeria, and accredits engineering programmes and firms.",
    website: "https://coren.gov.ng",
    socials: {},
    regions: [{ state: "fct", primary: true }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — government regulator website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Abuja", businessModel: "Regulator" },
  },
  {
    slug: "geregu-power",
    name: "Geregu Power",
    logo: "GP",
    color: "#F5A623",
    industrySlug: "energy-power",
    short: "Thermal power generation company listed on the Nigerian Exchange.",
    long: "Geregu Power operates a gas-fired power plant in Kogi State supplying electricity to the Nigerian national grid.",
    website: "https://gereguplc.com",
    socials: {},
    regions: [{ state: "kogi", primary: true }, { state: "lagos" }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — company website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { regulator: "NERC", businessModel: "B2B" },
  },
  {
    slug: "dangote-cement",
    name: "Dangote Cement",
    logo: "DC",
    color: "#4F46E5",
    industrySlug: "manufacturing",
    short: "Cement producer operating across several African countries.",
    long: "Dangote Cement manufactures and distributes cement from plants in Nigeria and other African markets, and is one of the largest companies listed on the Nigerian Exchange.",
    website: "https://www.dangotecement.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }, { state: "ogun" }, { state: "kogi" }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — company website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Lagos", businessModel: "B2B" },
  },
  {
    slug: "lekki-port",
    name: "Lekki Deep Sea Port",
    logo: "LP",
    color: "#0F9D58",
    industrySlug: "civil-engineering",
    short: "Deep seaport facility in the Lagos Free Zone.",
    long: "Lekki Port is a deep seaport in Lagos State built to handle container, liquid and dry bulk cargo, developed as a public-private partnership.",
    website: "https://lekkiport.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — company website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Lekki", businessModel: "B2B" },
  },
  {
    slug: "iita",
    name: "International Institute of Tropical Agriculture",
    logo: "II",
    color: "#0F9D58",
    industrySlug: "agritech-research",
    short: "Non-profit research institute for tropical agriculture.",
    long: "IITA is an international agricultural research institute headquartered in Ibadan, working on crop improvement, soil health and food security across sub-Saharan Africa.",
    website: "https://www.iita.org",
    socials: {},
    regions: [{ state: "oyo", primary: true }, { state: "fct" }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — institute website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Ibadan", businessModel: "Non-profit research" },
  },
  {
    slug: "nasrda",
    name: "National Space Research and Development Agency",
    logo: "NA",
    color: "#7C3AED",
    industrySlug: "space-geospatial",
    short: "Nigeria's national space agency.",
    long: "NASRDA coordinates Nigeria's space science and satellite programmes, including earth observation data used for mapping, agriculture and disaster response.",
    website: "https://nasrda.gov.ng",
    socials: {},
    regions: [{ state: "fct", primary: true }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — government agency website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Abuja", businessModel: "Government agency" },
  },
  {
    slug: "nimet",
    name: "Nigerian Meteorological Agency",
    logo: "NM",
    color: "#00C3F7",
    industrySlug: "environmental-science",
    short: "National meteorological and climate service.",
    long: "NiMet provides weather forecasting, climate monitoring and aviation meteorological services across Nigeria.",
    website: "https://nimet.gov.ng",
    socials: {},
    regions: [{ state: "fct", primary: true }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — government agency website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Abuja", businessModel: "Government agency" },
  },
  {
    slug: "nabda",
    name: "National Biotechnology Research and Development Agency",
    logo: "NB",
    color: "#14B8A6",
    industrySlug: "biotech",
    short: "Federal agency for biotechnology research and development.",
    long: "NABDA promotes and coordinates biotechnology research in Nigeria across agriculture, health, environment and industry.",
    website: "https://nabda.gov.ng",
    socials: {},
    regions: [{ state: "fct", primary: true }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — government agency website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Abuja", businessModel: "Government agency" },
  },
  {
    slug: "aluko-oyebode",
    name: "Aluko & Oyebode",
    logo: "AO",
    color: "#7C3AED",
    industrySlug: "law-firms",
    short: "Full-service commercial law firm.",
    long: "Aluko & Oyebode is one of Nigeria's largest commercial law firms, advising on corporate, energy, finance and dispute resolution matters.",
    website: "https://www.aluko-oyebode.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }, { state: "fct" }, { state: "rivers" }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — firm website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Lagos", regulator: "Nigerian Bar Association", businessModel: "B2B" },
  },
  {
    slug: "banwo-ighodalo",
    name: "Banwo & Ighodalo",
    logo: "BI",
    color: "#0E7C86",
    industrySlug: "law-firms",
    short: "Commercial law firm advising on corporate and finance matters.",
    long: "Banwo & Ighodalo is a Nigerian commercial law firm known for capital markets, corporate finance, energy and real estate work.",
    website: "https://www.banwo-ighodalo.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }, { state: "fct" }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — firm website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Lagos", regulator: "Nigerian Bar Association", businessModel: "B2B" },
  },
  {
    slug: "templars-law",
    name: "Templars",
    logo: "TE",
    color: "#B42318",
    industrySlug: "law-firms",
    short: "Commercial law firm with an energy and disputes focus.",
    long: "Templars is a Nigerian commercial law firm advising on energy and natural resources, finance, tax and dispute resolution.",
    website: "https://www.templars-law.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }, { state: "rivers" }, { state: "fct" }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — firm website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Lagos", regulator: "Nigerian Bar Association", businessModel: "B2B" },
  },
  {
    slug: "nigerian-bar-association",
    name: "Nigerian Bar Association",
    logo: "NB",
    color: "#4F46E5",
    industrySlug: "regulators-legal",
    short: "Professional association for legal practitioners in Nigeria.",
    long: "The NBA is the umbrella professional body for lawyers called to the Nigerian Bar, running branches nationwide and setting professional standards.",
    website: "https://nigerianbar.org.ng",
    socials: {},
    regions: [{ state: "fct", primary: true }, { state: "lagos" }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — association website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Abuja", businessModel: "Professional body" },
  },
  {
    slug: "university-of-lagos",
    name: "University of Lagos",
    logo: "UL",
    color: "#0F9D58",
    industrySlug: "universities",
    short: "Federal research university in Lagos.",
    long: "The University of Lagos is a federal university offering undergraduate and postgraduate programmes across arts, sciences, engineering, law, medicine and business.",
    website: "https://unilag.edu.ng",
    socials: {},
    regions: [{ state: "lagos", primary: true }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — university website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Yaba", regulator: "National Universities Commission", businessModel: "Public university" },
  },
  {
    slug: "obafemi-awolowo-university",
    name: "Obafemi Awolowo University",
    logo: "OA",
    color: "#0E7C86",
    industrySlug: "universities",
    short: "Federal university in Ile-Ife, Osun State.",
    long: "Obafemi Awolowo University is a federal university in Ile-Ife known for its architecture, engineering and science faculties.",
    website: "https://oauife.edu.ng",
    socials: {},
    regions: [{ state: "osun", primary: true }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — university website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Ile-Ife", regulator: "National Universities Commission", businessModel: "Public university" },
  },
  {
    slug: "covenant-university",
    name: "Covenant University",
    logo: "CU",
    color: "#7C3AED",
    industrySlug: "universities",
    short: "Private university in Ota, Ogun State.",
    long: "Covenant University is a private university offering programmes in engineering, sciences, business and social sciences.",
    website: "https://www.covenantuniversity.edu.ng",
    socials: {},
    regions: [{ state: "ogun", primary: true }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — university website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Abeokuta", regulator: "National Universities Commission", businessModel: "Private university" },
  },
  {
    slug: "yabatech",
    name: "Yaba College of Technology",
    logo: "YC",
    color: "#F5A623",
    industrySlug: "colleges",
    short: "Federal polytechnic in Lagos.",
    long: "Yabatech offers national and higher national diplomas across engineering, science and art disciplines.",
    website: "https://www.yabatech.edu.ng",
    socials: {},
    regions: [{ state: "lagos", primary: true }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — institution website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Yaba", regulator: "National Board for Technical Education", businessModel: "Public polytechnic" },
  },
  {
    slug: "ulesson",
    name: "uLesson",
    logo: "UE",
    color: "#E0356F",
    industrySlug: "edtech",
    short: "Learning app for secondary school students in Africa.",
    long: "uLesson delivers curriculum-aligned video lessons, quizzes and live classes to students across several African countries through a mobile app.",
    website: "https://ulesson.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }, { state: "fct" }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — company website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Lagos", businessModel: "B2C" },
  },
  {
    slug: "nira-research",
    name: "Nigerian Institute of Social and Economic Research",
    logo: "NI",
    color: "#14B8A6",
    industrySlug: "research-institutes",
    short: "Federal policy research institute.",
    long: "NISER conducts social and economic policy research to support government planning and development policy in Nigeria.",
    website: "https://niser.gov.ng",
    socials: {},
    regions: [{ state: "oyo", primary: true }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — institute website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Ibadan", businessModel: "Government research institute" },
  },
  {
    slug: "safaricom-mpesa",
    name: "Safaricom M-PESA",
    logo: "MP",
    color: "#0F9D58",
    industrySlug: "payments",
    short: "Mobile money service operated by Safaricom in Kenya.",
    long: "M-PESA is a mobile money transfer and payments service allowing users to deposit, withdraw and transfer money and pay for goods using a mobile phone.",
    website: "https://www.safaricom.co.ke",
    socials: {},
    regions: [{ state: "nairobi-county", primary: true }, { state: "mombasa-county" }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — company website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Nairobi", regulator: "Central Bank of Kenya", businessModel: "B2C" },
  },
  {
    slug: "mtn-momo-ghana",
    name: "MTN Mobile Money Ghana",
    logo: "MM",
    color: "#F5A623",
    industrySlug: "payments",
    short: "Mobile money service in Ghana.",
    long: "MTN MoMo provides mobile wallet, transfer and merchant payment services to customers across Ghana.",
    website: "https://mtn.com.gh",
    socials: {},
    regions: [{ state: "greater-accra", primary: true }, { state: "ashanti" }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — company website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Accra", regulator: "Bank of Ghana", businessModel: "B2C" },
  },
  {
    slug: "yoco",
    name: "Yoco",
    logo: "YO",
    color: "#4F46E5",
    industrySlug: "payments",
    short: "Card payments and point-of-sale for small businesses in South Africa.",
    long: "Yoco provides card readers, online payments and business tools aimed at small and medium enterprises in South Africa.",
    website: "https://www.yoco.com",
    socials: {},
    regions: [{ state: "western-cape", primary: true }, { state: "gauteng" }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — company website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Cape Town", businessModel: "B2B" },
  },
  {
    slug: "stellenbosch-university",
    name: "Stellenbosch University",
    logo: "SU",
    color: "#0E7C86",
    industrySlug: "universities",
    short: "Public research university in the Western Cape.",
    long: "Stellenbosch University is a public research university in South Africa with faculties spanning engineering, medicine, science, law and agriculture.",
    website: "https://www.sun.ac.za",
    socials: {},
    regions: [{ state: "western-cape", primary: true }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — university website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Stellenbosch", businessModel: "Public university" },
  },
  {
    slug: "kenyatta-national-hospital",
    name: "Kenyatta National Hospital",
    logo: "KN",
    color: "#10B981",
    industrySlug: "hospitals",
    short: "National referral hospital in Nairobi.",
    long: "Kenyatta National Hospital is Kenya's largest referral and teaching hospital, providing specialist care and training medical professionals.",
    website: "https://knh.or.ke",
    socials: {},
    regions: [{ state: "nairobi-county", primary: true }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — hospital website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Nairobi", hospitalType: "Referral / Teaching", ownership: "Public" },
  },
  {
    slug: "kigali-innovation-city",
    name: "Kigali Innovation City",
    logo: "KI",
    color: "#00C3F7",
    industrySlug: "engineering-consultancy",
    short: "Technology and innovation park development in Kigali.",
    long: "Kigali Innovation City is a development bringing together universities, technology companies and research facilities in Rwanda.",
    website: "https://kigaliinnovationcity.rw",
    socials: {},
    regions: [{ state: "kigali-province", primary: true }],
    tags: [],
    verification: "unverified",
    status: "active",
    rating: { score: 0, count: 0, dist: [0, 0, 0, 0, 0] },
    source: "Seed data — project website, not independently verified",
    lastVerified: "2026-08-13",
    founders: [],
    cf: { city: "Kigali", businessModel: "B2B" },
  },
];

// ---------------------------------------------------------------------------
// FieldProvenance — only for facts backed by a real, citable URL from the
// research pass. Everything else in LISTINGS above was corrected/enriched
// without inventing a citation, per the task's instruction not to fabricate
// provenance for uncited facts.
// ---------------------------------------------------------------------------
type ProvenanceSeed = { slug: string; fieldKey: string; valueText: string; sourceUrl: string; confidence: number };

const FIELD_PROVENANCE: ProvenanceSeed[] = [
  { slug: "opay", fieldKey: "total_funding_raised", valueText: "570000000", sourceUrl: "https://www.cbinsights.com/research/opay-series-c-funding/", confidence: 0.8 },
  { slug: "opay", fieldKey: "funding_round:series_c", valueText: "Series C — $400M led by SoftBank Vision Fund 2, announced 2021-08-23, valuation $2B", sourceUrl: "https://techcabal.com/2021/08/23/led-by-softbank-nigerias-opay-raises-400m/", confidence: 0.85 },
  { slug: "flutterwave", fieldKey: "total_funding_raised", valueText: "475000000", sourceUrl: "https://techcrunch.com/2022/02/16/african-fintech-flutterwave-triples-valuation-to-over-3b-after-250m-series-d", confidence: 0.8 },
  { slug: "flutterwave", fieldKey: "funding_round:series_d", valueText: "Series D — $250M led by B Capital Group, announced 2022-02-16, valuation over $3B", sourceUrl: "https://techcrunch.com/2022/02/16/african-fintech-flutterwave-triples-valuation-to-over-3b-after-250m-series-d", confidence: 0.85 },
  { slug: "paystack", fieldKey: "funding_round:series_a", valueText: "Series A — $8M led by Stripe with Visa and Y Combinator, announced 2018-08; acquired by Stripe Oct 2020 for a reported $200M+", sourceUrl: "https://techcrunch.com/2020/10/15/daily-crunch-stripe-acquires-nigerias-paystack/", confidence: 0.8 },
  { slug: "carbon", fieldKey: "founding_year", valueText: "2012 (as \"One Credit\", rebranded Paylater then Carbon in 2019)", sourceUrl: "https://techpoint.africa/2020/02/18/carbon-disrupt-fund/", confidence: 0.75 },
  { slug: "carbon", fieldKey: "total_funding_raised", valueText: "~10000000 across a 2020 Series A with NET1 and Lendable, plus Google Launchpad Accelerator support", sourceUrl: "https://techpoint.africa/2020/02/18/carbon-disrupt-fund/", confidence: 0.7 },
  { slug: "piggyvest", fieldKey: "total_funding_raised", valueText: "~1150000 across two seed-stage rounds: ~$1M led by LeadPath Nigeria (2018-05-31) with Village Capital and Ventures Platform, plus an earlier separate $50K Village Capital round", sourceUrl: "https://articles.connectnigeria.com/fin-tech-startup-piggybank-now-known-as-piggyvest/", confidence: 0.75 },
  { slug: "reliance-hmo", fieldKey: "funding_round:series_b", valueText: "Series B — $40M led by General Atlantic, announced 2022-02-07 (General Atlantic's first African tech investment)", sourceUrl: "https://www.generalatlantic.com/media-article/reliance-health-raises-40m-in-series-b-led-by-general-atlantic/", confidence: 0.85 },
  { slug: "reddington-hospital", fieldKey: "year_established", valueText: "2006 (earlier Cardiac Centre on the same site from 2001)", sourceUrl: "https://en.wikipedia.org/wiki/Reddington_Hospital", confidence: 0.7 },
  { slug: "reddington-hospital", fieldKey: "accreditation", valueText: "COHSASA (July 2012 — first independent hospital in Nigeria to receive it), JCI, NHIS", sourceUrl: "https://en.wikipedia.org/wiki/Reddington_Hospital", confidence: 0.7 },
  { slug: "lagoon-hospitals", fieldKey: "year_established", valueText: "1986", sourceUrl: "https://en.wikipedia.org/wiki/Lagoon_Hospitals", confidence: 0.7 },
  { slug: "lagoon-hospitals", fieldKey: "accreditation", valueText: "First hospital in sub-Saharan Africa to receive JCI's Gold Seal of Approval, in 2011", sourceUrl: "https://en.wikipedia.org/wiki/Lagoon_Hospitals", confidence: 0.7 },
  { slug: "nisa-premier", fieldKey: "year_established", valueText: "1996, founded by Dr. Ibrahim Wada, originally in Gwagwalada (FCT)", sourceUrl: "https://nisa.com.ng/about/", confidence: 0.75 },
  { slug: "nisa-premier", fieldKey: "address", valueText: "15-21 Alex Ekwueme Way, Jabi, Abuja (relocated from Gwagwalada in 2000)", sourceUrl: "https://nisa.com.ng/about/", confidence: 0.75 },
  { slug: "nisa-premier", fieldKey: "specialties", valueText: "Fertility & Genetics, Gynaecology, Surgery, Maternity Care, Paediatrics & Neonatology, Accidents & Emergency, Imaging/Radiology, Dental, Eye", sourceUrl: "https://nisa.com.ng/about/", confidence: 0.75 },
  { slug: "first-cardiology", fieldKey: "year_established", valueText: "2008", sourceUrl: "https://www.firstcardiology.org/", confidence: 0.7 },
  { slug: "first-cardiology", fieldKey: "address", valueText: "20A Thompson Avenue, Ikoyi, Lagos", sourceUrl: "https://www.firstcardiology.org/", confidence: 0.7 },
];

// ---------------------------------------------------------------------------
// Reviews — unchanged content, now seeded with status="published" (demo
// content meant to populate the review-deck UI, not content awaiting
// moderation) and userId left null (no real accounts behind them).
// ---------------------------------------------------------------------------
const REVIEWS: Record<string, { authorName: string; authorRole: string; rating: number; title: string; body: string }[]> = {
  opay: [
    {
      authorName: "Chukwuemeka Ibe",
      authorRole: "Small business owner, Lagos",
      rating: 5,
      title: "My agent business runs on this app",
      body: "I use OPay to settle almost every customer transaction at my shop in Ikeja. Transfers land instantly nine times out of ten, and the agent commission structure genuinely pays my rent. Support can be slow during peak hours, but the core product just works.",
    },
    {
      authorName: "Fatima Suleiman",
      authorRole: "Freelance graphic designer",
      rating: 4,
      title: "Reliable, but the app can be a lot",
      body: "OPay does everything from bills to savings to betting top-ups, which is powerful but occasionally overwhelming to navigate. The transfer speed and virtual card for online payments have been the two features I actually depend on daily.",
    },
  ],
  flutterwave: [
    {
      authorName: "Daniel Okafor",
      authorRole: "CTO, e-commerce startup",
      rating: 5,
      title: "Integration took an afternoon, not a sprint",
      body: "We switched our checkout to Flutterwave last year mainly for the multi-currency support. The API docs are clear, the sandbox is honest about edge cases, and settlement to our bank account has been consistent to the day.",
    },
    {
      authorName: "Amara Nwankwo",
      authorRole: "Finance lead, logistics company",
      rating: 4,
      title: "Solid for cross-border payouts",
      body: "We pay vendors in three countries through Flutterwave and it has cut our payout time from days to hours. The dashboard reporting could use more granular export options, but reconciliation is otherwise painless.",
    },
  ],
  paystack: [
    {
      authorName: "Bolaji Adeyinka",
      authorRole: "Founder, subscription box service",
      rating: 5,
      title: "The gold standard for Nigerian checkout",
      body: "Paystack's checkout conversion has been noticeably better than every alternative we tested. Webhooks are dependable, the docs are the best I've used from any African fintech, and their support actually replies within hours.",
    },
    {
      authorName: "Grace Effiong",
      authorRole: "Operations manager, retail chain",
      rating: 5,
      title: "POS and online in one dashboard",
      body: "Having our in-store terminal transactions and online payments reconciled in a single view saved our accounts team hours every week. Rarely any downtime worth mentioning over the past year.",
    },
  ],
  carbon: [
    {
      authorName: "Ifeanyi Umeh",
      authorRole: "Everyday user, Lagos",
      rating: 4,
      title: "Quick loans when I've needed them",
      body: "I've taken three short-term loans through Carbon and approval has never taken more than a few minutes. Interest rates are on the higher side, which is worth going in knowing, but the process is transparent about the total repayment upfront.",
    },
  ],
  piggyvest: [
    {
      authorName: "Temidayo Alabi",
      authorRole: "Marketing associate",
      rating: 5,
      title: "Finally stuck to a savings habit",
      body: "The auto-save feature locked to my payday is the only thing that has ever made me consistent with saving. The Flex Naira wallet for near-instant access to part of my savings is the feature I recommend to everyone.",
    },
  ],
  "reliance-hmo": [
    {
      authorName: "Ngozi Eke",
      authorRole: "HR manager, tech company",
      rating: 4,
      title: "Made rolling out staff health cover simple",
      body: "We onboarded our whole team onto Reliance Health plans in under two weeks. The telemedicine option gets heavy use from remote staff, and claims for routine visits have been processed without the back-and-forth we dealt with from our previous provider.",
    },
  ],
  "reddington-hospital": [
    {
      authorName: "Mrs. Adaobi Nnamdi",
      authorRole: "Patient, cardiology outpatient",
      rating: 5,
      title: "Cath lab team was excellent",
      body: "My father had an angioplasty done here and the cardiology team walked us through every step before and after. The ward was clean, nurses were responsive at night, and billing was itemised clearly with no surprise charges.",
    },
    {
      authorName: "Emeka Onuoha",
      authorRole: "Patient, emergency admission",
      rating: 4,
      title: "Fast emergency intake",
      body: "Came in after a road accident and was triaged within minutes. The 24/7 emergency desk clearly sees a lot of volume — wait times for non-critical follow-up appointments afterward were longer than I expected.",
    },
  ],
  "lagoon-hospitals": [
    {
      authorName: "Yetunde Bankole",
      authorRole: "Patient, maternity ward",
      rating: 5,
      title: "Delivered both my children here",
      body: "The maternity team at Lagoon has looked after my family through two pregnancies now. JCI accreditation shows in how consistently protocols are followed, from prenatal visits through to postnatal checks.",
    },
  ],
  "nisa-premier": [
    {
      authorName: "Aisha Bello",
      authorRole: "Patient, fertility clinic",
      rating: 4,
      title: "Good specialist care in Abuja",
      body: "Nisa Premier's fertility unit was recommended by a friend and the consultants were thorough with diagnostics before recommending a treatment plan. Front-desk scheduling can be a bit slow to respond by phone.",
    },
  ],
  "first-cardiology": [
    {
      authorName: "Chidi Okonji",
      authorRole: "Patient, echocardiography",
      rating: 5,
      title: "Specialists who explain everything clearly",
      body: "As a dedicated cardiac centre, the level of specialisation really shows. My consultant walked me through my echo results in plain language and gave a clear follow-up plan rather than rushing to the next patient.",
    },
  ],
  "duchess-international": [
    {
      authorName: "Funmilayo Adekunle",
      authorRole: "Patient, oncology day ward",
      rating: 4,
      title: "Comprehensive care close to home",
      body: "Being a teaching hospital, there were sometimes more staff in the room than I expected during rounds, but the oncology day ward team were attentive and the ICU transfer process when needed was well coordinated.",
    },
  ],
};

// Real, citable award (see task notes) — the only Award row seeded.
const DUCHESS_AWARD = {
  title: "Best Tertiary Private Hospital in Nigeria",
  awardedBy: "National Healthcare Excellence Awards (NHEA)",
  sourceUrl: "https://naijasabi.com.ng/best-private-hospitals-lagos-2026/",
  awardedOn: null as Date | null, // year not confirmed — not guessed
};

async function main() {
  console.log("Seeding IndexOne database...");

  // ---- Regions (tree) ----
  const regionBySlug = new Map<string, string>();
  for (const r of REGIONS) {
    const parentId = r.parentSlug ? regionBySlug.get(r.parentSlug) : undefined;
    const row = await prisma.region.upsert({
      where: { slug: r.slug },
      update: { name: r.name, level: r.level, isoCode: r.isoCode ?? null, note: r.note ?? null, parentId: parentId ?? null },
      create: { slug: r.slug, name: r.name, level: r.level, isoCode: r.isoCode ?? null, note: r.note ?? null, parentId: parentId ?? null },
    });
    regionBySlug.set(r.slug, row.id);
  }

  // Look up city regions by display name, so a listing's free-text `city`
  // ("Ikeja", "Cape Town") can be matched to a real region row. Lowercased
  // because the two are typed independently and casing drifts.
  const cityIdByName = new Map<string, string>();
  for (const r of REGIONS) {
    if (r.level === "city") cityIdByName.set(r.name.toLowerCase(), regionBySlug.get(r.slug)!);
  }
  // Collected while seeding and reported at the end — a city named on a
  // listing but missing from REGIONS is a gap worth seeing, not a crash.
  const unmatchedCities = new Set<string>();

  // ---- Industries (tree) ----
  const industryBySlug = new Map<string, string>();
  for (const ind of INDUSTRIES) {
    const parentId = ind.parentSlug ? industryBySlug.get(ind.parentSlug) : undefined;
    const row = await prisma.industry.upsert({
      where: { slug: ind.slug },
      update: {
        name: ind.name,
        level: ind.level,
        icon: ind.icon ?? null,
        accent: ind.accent ?? null,
        schemaExtension: ind.schemaExtension ?? null,
        note: ind.note ?? null,
        parentId: parentId ?? null,
      },
      create: {
        slug: ind.slug,
        name: ind.name,
        level: ind.level,
        icon: ind.icon ?? null,
        accent: ind.accent ?? null,
        schemaExtension: ind.schemaExtension ?? null,
        note: ind.note ?? null,
        parentId: parentId ?? null,
      },
    });
    industryBySlug.set(ind.slug, row.id);
  }

  // ---- Features / tags ----
  const featureBySlug = new Map<string, string>();
  for (const vertical of Object.keys(TAGS)) {
    const industryId = industryBySlug.get(vertical)!;
    for (const t of TAGS[vertical]) {
      const row = await prisma.feature.upsert({
        where: { slug: t.slug },
        update: { name: t.name, group: t.grp, industryId },
        create: { slug: t.slug, name: t.name, group: t.grp, industryId },
      });
      featureBySlug.set(t.slug, row.id);
    }
  }

  // ---- Field definitions (registry) ----
  for (const fd of FIELD_DEFINITIONS) {
    const industryId = industryBySlug.get(fd.industrySlug);
    if (!industryId) continue;
    await prisma.fieldDefinition.upsert({
      where: { industryId_fieldKey: { industryId, fieldKey: fd.fieldKey } },
      update: {
        label: fd.label,
        dataType: fd.dataType,
        required: fd.required ?? false,
        optionsJson: fd.optionsJson ?? undefined,
        section: fd.section ?? null,
        displayOrder: fd.displayOrder ?? null,
        helpText: fd.helpText ?? null,
      },
      create: {
        industryId,
        fieldKey: fd.fieldKey,
        label: fd.label,
        dataType: fd.dataType,
        required: fd.required ?? false,
        optionsJson: fd.optionsJson ?? undefined,
        section: fd.section ?? null,
        displayOrder: fd.displayOrder ?? null,
        helpText: fd.helpText ?? null,
      },
    });
  }

  // ---- Data sources ----
  const dataSourceBySlug = new Map<string, string>();
  for (const ds of DATA_SOURCES) {
    const row = await prisma.dataSource.upsert({
      where: { key: ds.key },
      update: {
        name: ds.name,
        kind: ds.kind,
        trustRank: ds.trustRank,
        isPaid: ds.isPaid,
        rateLimitNote: "rateLimitNote" in ds ? (ds as { rateLimitNote?: string }).rateLimitNote ?? null : null,
        lastRunAt: ds.lastRunAt,
      },
      create: {
        key: ds.key,
        name: ds.name,
        kind: ds.kind,
        trustRank: ds.trustRank,
        isPaid: ds.isPaid,
        rateLimitNote: "rateLimitNote" in ds ? (ds as { rateLimitNote?: string }).rateLimitNote ?? null : null,
        lastRunAt: ds.lastRunAt,
      },
    });
    dataSourceBySlug.set(ds.key, row.id);
  }
  const manualResearchSourceId = dataSourceBySlug.get("manual_web_research")!;

  // ---- score_weights v1 — 100% website-signal today, honestly ----
  await prisma.scoreWeight.upsert({
    where: { version_scoreType_component: { version: "v1", scoreType: "activity", component: "website" } },
    update: { weight: 1.0, effectiveFrom: new Date("2026-08-07") },
    create: {
      version: "v1",
      scoreType: "activity",
      component: "website",
      weight: 1.0,
      effectiveFrom: new Date("2026-08-07"),
    },
  });

  // ---- Investors (deduped across all companies) ----
  const investorBySlug = new Map<string, string>();
  for (const l of LISTINGS) {
    const investors = l.cf.investors ?? [];
    for (const inv of investors) {
      const slug = slugify(inv.n);
      if (investorBySlug.has(slug)) continue;
      const row = await prisma.investor.upsert({
        where: { slug },
        update: { name: inv.n, type: inv.t },
        create: { slug, name: inv.n, type: inv.t },
      });
      investorBySlug.set(slug, row.id);
    }
  }

  // ---- Companies + nested data ----
  for (const l of LISTINGS) {
    const industryId = industryBySlug.get(l.industrySlug);
    if (!industryId) throw new Error(`Missing industry for ${l.slug} (${l.industrySlug})`);

    const cf = l.cf;

    const companyData = {
      name: l.name,
      logoInitials: l.logo,
      logoColor: l.color,
      industryId,
      shortDescription: l.short,
      longDescription: l.long,
      website: l.website,
      heroImageId: HERO[l.slug] ?? null,
      socials: l.socials,
      registrationBody: "CAC (Nigeria)",
      foundingYear: cf.foundingYear ?? null,
      employeeRange: cf.employees ?? null,
      businessModel: cf.businessModel ?? null,
      regulator: cf.regulator ?? null,
      status: l.status,
      verification: l.verification,
      source: l.source,
      lastVerifiedAt: new Date(l.lastVerified),
      // A listing with no reviews behind it gets a null score rather than a
      // fabricated one. The admin review queue recomputes these from real
      // published reviews (see recomputeRating in lib/companyWrite.ts).
      ratingScore: l.rating.count > 0 ? l.rating.score : null,
      ratingCount: l.rating.count,
      ratingDist: l.rating.count > 0 ? l.rating.dist : undefined,
      totalFunding: cf.totalFunding ?? null,
      valuation: cf.valuation ?? null,
      valuationDate: cf.valuationDate ?? null,
      licenses: cf.licenses ?? undefined,
      hospitalType: cf.hospitalType ?? null,
      ownership: cf.ownership ?? null,
      yearEstablished: cf.yearEstablished ?? null,
      bedCapacity: cf.bedCapacity ?? null,
      emergency: cf.emergency ?? null,
      city: cf.city ?? null,
      address: cf.address ?? null,
      services: cf.services ?? undefined,
      accreditation: cf.accreditation ?? undefined,
      accreditationBody: cf.accreditationBody ?? null,
      facilityBody: cf.facilityBody ?? null,
      facilityNo: cf.facilityNo ?? null,
      contactPhone: cf.contactPhone ?? null,
      contactEmail: cf.contactEmail ?? null,
    };

    const company = await prisma.company.upsert({
      where: { slug: l.slug },
      // Re-running the seed repairs previously-seeded rows (repointed
      // category slugs, the Duchess address fix, corrected funding figures).
      update: { ...companyData, tags: { set: l.tags.map((slug) => ({ id: featureBySlug.get(slug)! })) } },
      create: { slug: l.slug, ...companyData, tags: { connect: l.tags.map((slug) => ({ id: featureBySlug.get(slug)! })) } },
    });

    // Regions — state level
    for (const r of l.regions) {
      const regionId = regionBySlug.get(r.state);
      if (!regionId) continue;
      await prisma.companyRegion.upsert({
        where: { companyId_regionId: { companyId: company.id, regionId } },
        update: { isPrimary: !!r.primary },
        create: { companyId: company.id, regionId, isPrimary: !!r.primary },
      });
    }

    // Regions — city level.
    //
    // Listings carry a free-text `city` (e.g. "Ikeja") which is what the
    // company page displays, but that string alone is not filterable. If it
    // resolves to a real city region, attach that too, so /directory?region=
    // <city> works and so the country > state > city hierarchy is populated
    // at every level rather than only the middle one.
    //
    // Never marked primary: the primary region stays the state, which is what
    // the directory table shows in its Region column.
    const cityName = cf.city?.trim();
    if (cityName) {
      const cityId = cityIdByName.get(cityName.toLowerCase());
      if (cityId) {
        await prisma.companyRegion.upsert({
          where: { companyId_regionId: { companyId: company.id, regionId: cityId } },
          update: {},
          create: { companyId: company.id, regionId: cityId, isPrimary: false },
        });
      } else {
        // Not an error — plenty of listings sit in a city we haven't seeded.
        // The name still shows on the listing; it just isn't a filter yet.
        unmatchedCities.add(cityName);
      }
    }

    // Founders -> Person + ListingPerson
    for (const f of l.founders) {
      const personSlug = slugify(f.name);
      const person = await prisma.person.upsert({
        where: { slug: personSlug },
        update: { name: f.name },
        create: { slug: personSlug, name: f.name },
      });
      await prisma.listingPerson.upsert({
        where: { personId_companyId_role: { personId: person.id, companyId: company.id, role: "founder" } },
        update: { isCurrent: true },
        create: {
          personId: person.id,
          companyId: company.id,
          role: "founder",
          isCurrent: true,
          startDate: null, // no real per-person founding dates available, only company founding years
        },
      });
    }

    // Funding rounds + investor linkage (fintech only)
    const rounds = cf.rounds ?? [];
    const investors = cf.investors ?? [];
    const matchedInvestorSlugs = new Set<string>();

    for (const round of rounds) {
      const existingRound = await prisma.fundingRound.findFirst({
        where: { companyId: company.id, round: round.r, date: round.d },
      });
      const roundRow =
        existingRound ??
        (await prisma.fundingRound.create({
          data: {
            companyId: company.id,
            round: round.r,
            date: round.d,
            amount: round.a,
            currency: round.c ?? null,
            leadInvestor: round.l,
            sourceUrl: round.src ?? null,
          },
        }));
      if (existingRound && (round.c || round.src)) {
        await prisma.fundingRound.update({
          where: { id: roundRow.id },
          data: { currency: round.c ?? existingRound.currency, sourceUrl: round.src ?? existingRound.sourceUrl },
        });
      }

      const parts = round.l.split("/").map((p) => p.trim());
      for (const part of parts) {
        const matched = investors.find(
          (inv) =>
            inv.n.toLowerCase() === part.toLowerCase() ||
            part.toLowerCase().includes(inv.n.toLowerCase()) ||
            inv.n.toLowerCase().includes(part.toLowerCase()),
        );
        if (!matched) continue;
        const investorId = investorBySlug.get(slugify(matched.n));
        if (!investorId) continue;
        matchedInvestorSlugs.add(slugify(matched.n));
        const existingJoin = await prisma.companyInvestor.findFirst({
          where: { companyId: company.id, investorId, fundingRoundId: roundRow.id },
        });
        if (!existingJoin) {
          await prisma.companyInvestor.create({
            data: { companyId: company.id, investorId, fundingRoundId: roundRow.id },
          });
        }
      }
    }

    // Remaining investors not tied to a specific round: general association
    for (const inv of investors) {
      const slug = slugify(inv.n);
      if (matchedInvestorSlugs.has(slug)) continue;
      const investorId = investorBySlug.get(slug);
      if (!investorId) continue;
      const existingJoin = await prisma.companyInvestor.findFirst({
        where: { companyId: company.id, investorId, fundingRoundId: null },
      });
      if (!existingJoin) {
        await prisma.companyInvestor.create({
          data: { companyId: company.id, investorId, fundingRoundId: null },
        });
      }
    }

    // Reviews — demo content, published (not awaiting moderation), no real user.
    const reviews = REVIEWS[l.slug] ?? [];
    for (const rv of reviews) {
      const existingReview = await prisma.review.findFirst({
        where: { companyId: company.id, authorName: rv.authorName, title: rv.title },
      });
      if (!existingReview) {
        await prisma.review.create({
          data: {
            companyId: company.id,
            authorName: rv.authorName,
            authorRole: rv.authorRole,
            rating: rv.rating,
            title: rv.title,
            body: rv.body,
            status: "published",
          },
        });
      } else if (existingReview.status !== "published") {
        await prisma.review.update({ where: { id: existingReview.id }, data: { status: "published" } });
      }
    }

    // Field provenance — only cited facts.
    const provenance = FIELD_PROVENANCE.filter((p) => p.slug === l.slug);
    for (const p of provenance) {
      const existing = await prisma.fieldProvenance.findFirst({
        where: { companyId: company.id, fieldKey: p.fieldKey, sourceId: manualResearchSourceId },
      });
      if (!existing) {
        await prisma.fieldProvenance.create({
          data: {
            companyId: company.id,
            fieldKey: p.fieldKey,
            valueText: p.valueText,
            sourceId: manualResearchSourceId,
            sourceUrl: p.sourceUrl,
            confidence: p.confidence,
            fetchedAt: new Date(),
            isWinning: true,
          },
        });
      }
    }

    // Duchess's real, citable NHEA award.
    if (l.slug === "duchess-international") {
      const existingAward = await prisma.award.findFirst({
        where: { companyId: company.id, title: DUCHESS_AWARD.title },
      });
      if (!existingAward) {
        await prisma.award.create({
          data: {
            companyId: company.id,
            title: DUCHESS_AWARD.title,
            awardedBy: DUCHESS_AWARD.awardedBy,
            sourceUrl: DUCHESS_AWARD.sourceUrl,
            awardedOn: DUCHESS_AWARD.awardedOn,
          },
        });
      }
    }
  }

  const counts = {
    companies: await prisma.company.count(),
    regions: await prisma.region.count(),
    industries: await prisma.industry.count(),
    features: await prisma.feature.count(),
    fieldDefinitions: await prisma.fieldDefinition.count(),
    dataSources: await prisma.dataSource.count(),
    investors: await prisma.investor.count(),
    fundingRounds: await prisma.fundingRound.count(),
    people: await prisma.person.count(),
    listingPeople: await prisma.listingPerson.count(),
    reviews: await prisma.review.count(),
    fieldProvenance: await prisma.fieldProvenance.count(),
    awards: await prisma.award.count(),
  };
  if (unmatchedCities.size) {
    console.log(
      `Note: ${unmatchedCities.size} city name(s) on listings have no matching city region, so they aren't filterable yet:`,
      Array.from(unmatchedCities).sort().join(", "),
    );
  }

  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
