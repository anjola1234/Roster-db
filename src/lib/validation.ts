import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  password: z.string().min(1, "Password is required").max(200),
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
});

export const reviewSchema = z.object({
  companySlug: z.string().trim().min(1).max(200),
  authorName: z.string().trim().min(2, "Name is too short").max(100),
  authorRole: z.string().trim().min(2, "Role is too short").max(150),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(3, "Title is too short").max(150),
  body: z.string().trim().min(10, "Please write a little more").max(4000),
});

// ---------------------------------------------------------------------------
// Admin dashboard
// ---------------------------------------------------------------------------

/** HTML form fields arrive as "" when left blank; treat that as absent. */
const blankToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

const optionalText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

const optionalUrl = z.preprocess(
  blankToUndefined,
  z.string().trim().url("Enter a full URL, e.g. https://example.com").max(500).optional(),
);

const optionalInt = (min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().int().min(min).max(max).optional());

const optionalMoney = z.preprocess(
  blankToUndefined,
  z.coerce.number().min(0).max(1_000_000_000_000).optional(),
);

/** Comma-separated free text ("Cardiology, Oncology") -> string[]. */
const optionalList = z.preprocess(
  blankToUndefined,
  z
    .string()
    .max(2000)
    .optional()
    .transform((s) =>
      s
        ? s
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean)
        : undefined,
    ),
);

export const LISTING_STATUSES = ["draft", "pending", "active", "archived"] as const;
export const VERIFICATION_STATUSES = ["unverified", "verified", "flagged"] as const;
export const LIFECYCLE_STATUSES = [
  "operating",
  "closed",
  "acquired",
  "merged",
  "unverified",
] as const;

export const adminCompanySchema = z.object({
  // --- identity ---
  name: z.string().trim().min(2, "Name is too short").max(150),
  slug: z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .max(200)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase words separated by hyphens")
      .optional(),
  ),
  logoInitials: optionalText(4),
  logoColor: z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #4F46E5")
      .optional(),
  ),

  // --- taxonomy ---
  industrySlug: z.string().trim().min(1, "Pick an industry").max(100),
  regionSlugs: z.array(z.string().trim().min(1).max(100)).min(1, "Pick at least one region"),
  primaryRegionSlug: z.string().trim().min(1, "Pick a primary region").max(100),
  tagSlugs: z.array(z.string().trim().min(1).max(100)).max(40).default([]),

  // --- copy ---
  shortDescription: z.string().trim().min(10, "Short description is too short").max(300),
  longDescription: z.string().trim().min(20, "Full description is too short").max(4000),
  website: z.string().trim().url("Enter a full URL, e.g. https://example.com").max(300),

  // --- shared base fields ---
  foundingYear: optionalInt(1800, 2100),
  employeeRange: optionalText(60),
  businessModel: optionalText(120),
  regulator: optionalText(200),
  registrationBody: optionalText(120),
  registrationNumber: optionalText(120),
  registrationLink: optionalUrl,
  source: optionalText(300),
  submittedByEmail: z.preprocess(
    blankToUndefined,
    z.string().trim().toLowerCase().email("Enter a valid email").max(200).optional(),
  ),

  // --- socials ---
  socialX: optionalUrl,
  socialLinkedin: optionalUrl,
  socialInstagram: optionalUrl,
  socialFacebook: optionalUrl,

  // --- editorial state ---
  status: z.enum(LISTING_STATUSES),
  verification: z.enum(VERIFICATION_STATUSES),
  lifecycleStatus: z.enum(LIFECYCLE_STATUSES),

  // --- fintech extension ---
  totalFunding: optionalMoney,
  valuation: optionalMoney,
  valuationDate: optionalText(40),
  licenses: optionalList,

  // --- hospital extension ---
  hospitalType: optionalText(120),
  ownership: optionalText(120),
  yearEstablished: optionalInt(1800, 2100),
  bedCapacity: optionalInt(0, 100000),
  // Not z.coerce.boolean(): that reads the *string* "false" as true, which is
  // exactly what a <select> would send for "No emergency department".
  emergency: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v === true || v === "true"),
    z.boolean().optional(),
  ),
  city: optionalText(150),
  address: optionalText(300),
  services: optionalList,
  accreditation: optionalList,
  accreditationBody: optionalText(200),
  facilityBody: optionalText(200),
  facilityNo: optionalText(120),
  contactPhone: optionalText(60),
  contactEmail: z.preprocess(
    blankToUndefined,
    z.string().trim().toLowerCase().email("Enter a valid email").max(200).optional(),
  ),
});

export type AdminCompanyInput = z.infer<typeof adminCompanySchema>;

/** One row of a CSV bulk import — a deliberately small subset of the full form. */
export const importRowSchema = z.object({
  name: z.string().trim().min(2).max(150),
  industrySlug: z.string().trim().min(1).max(100),
  regionSlug: z.string().trim().min(1).max(100),
  shortDescription: z.string().trim().min(10).max(300),
  longDescription: z.string().trim().min(20).max(4000),
  website: z.string().trim().url("Enter a full URL").max(300),
  city: optionalText(150),
  foundingYear: optionalInt(1800, 2100),
});

export const importPayloadSchema = z.object({
  // "validate" is a dry run: every row is checked and reported on, nothing is
  // written. The UI always runs it before offering the commit button.
  mode: z.enum(["validate", "commit"]).default("validate"),
  rows: z.array(z.unknown()).min(1, "Nothing to import").max(500, "Import at most 500 rows at a time"),
  // Imported rows land as drafts by default so a bad file can never publish
  // itself straight onto the public directory.
  status: z.enum(LISTING_STATUSES).default("draft"),
});

/** Optional justification and supporting links, per spec section 12. */
const auditReason = optionalText(1000);
const auditEvidence = z.preprocess(
  blankToUndefined,
  z.array(z.string().trim().max(500)).max(10).optional(),
);

export const moderateCompanySchema = z.object({
  action: z.enum(["approve", "reject", "verify", "unverify", "flag", "archive", "restore"]),
  reason: auditReason,
  evidence: auditEvidence,
});

export const moderateReviewSchema = z.object({
  action: z.enum(["publish", "reject", "remove", "unpublish"]),
  reason: auditReason,
});

export const moderateClaimSchema = z.object({
  action: z.enum(["approve", "reject", "revoke"]),
  note: optionalText(500),
});

export const claimSubmissionSchema = z.object({
  companySlug: z.string().trim().min(1).max(200),
  claimedRole: z.enum(["owner", "employee", "agency", "other"]),
  proofMethod: z.enum(["work_email", "dns_txt", "document", "phone_callback"]),
});

export const productSubmissionSchema = z.object({
  name: z.string().trim().min(2).max(150),
  industrySlug: z.string().trim().min(1).max(100),
  shortDescription: z.string().trim().min(10).max(300),
  longDescription: z.string().trim().min(20).max(4000),
  website: z.string().trim().url("Enter a full URL, e.g. https://example.com").max(300),
  submittedByEmail: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  regionSlug: z.string().trim().min(1).max(100),
  city: z.string().trim().max(150).optional().or(z.literal("")),
});
