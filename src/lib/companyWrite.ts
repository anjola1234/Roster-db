import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { AdminCompanyInput } from "@/lib/validation";

// ---------------------------------------------------------------------------
// Derived listing identity (slug / initials / logo colour).
// These used to live inline in src/app/api/products/route.ts; they're shared
// now so a public submission and an admin-created listing produce identical
// values instead of drifting apart.
// ---------------------------------------------------------------------------

const PALETTE = [
  "#4F46E5",
  "#7C3AED",
  "#0F9D58",
  "#F5A623",
  "#00C3F7",
  "#E0356F",
  "#0E7C86",
  "#B42318",
];

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function initialsFor(name: string) {
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

export function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/**
 * Finds a free slug, appending -2, -3, … on collision.
 * `excludeId` lets an edit keep its own slug without colliding with itself.
 */
export async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base);
  if (!root) return null;
  let candidate = root;
  let attempt = 1;
  for (;;) {
    const existing = await prisma.company.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    attempt += 1;
    candidate = `${root}-${attempt}`;
  }
}

// ---------------------------------------------------------------------------
// Admin form payload -> Prisma column data
// ---------------------------------------------------------------------------

/** Nullable Json columns need Prisma.DbNull to actually clear, not `null`. */
function jsonOrNull(value: unknown) {
  return value === undefined || value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

function socialsFrom(input: AdminCompanyInput) {
  const socials: Record<string, string> = {};
  if (input.socialX) socials.x = input.socialX;
  if (input.socialLinkedin) socials.linkedin = input.socialLinkedin;
  if (input.socialInstagram) socials.instagram = input.socialInstagram;
  if (input.socialFacebook) socials.facebook = input.socialFacebook;
  return Object.keys(socials).length ? socials : undefined;
}

/**
 * The scalar half of a company write. Relations (industry, regions, tags) are
 * resolved separately by the caller, which has already validated that the
 * referenced taxonomy rows exist.
 */
export function companyScalarData(input: AdminCompanyInput) {
  return {
    name: input.name,
    logoInitials: input.logoInitials || initialsFor(input.name),
    logoColor: input.logoColor || colorFor(input.name),
    shortDescription: input.shortDescription,
    longDescription: input.longDescription,
    website: input.website,
    socials: jsonOrNull(socialsFrom(input)),

    registrationBody: input.registrationBody ?? null,
    registrationNumber: input.registrationNumber ?? null,
    registrationLink: input.registrationLink ?? null,

    foundingYear: input.foundingYear ?? null,
    employeeRange: input.employeeRange ?? null,
    businessModel: input.businessModel ?? null,
    regulator: input.regulator ?? null,

    status: input.status,
    verification: input.verification,
    lifecycleStatus: input.lifecycleStatus,
    source: input.source ?? null,
    submittedByEmail: input.submittedByEmail ?? null,

    // fintech extension
    totalFunding: input.totalFunding ?? null,
    valuation: input.valuation ?? null,
    valuationDate: input.valuationDate ?? null,
    licenses: jsonOrNull(input.licenses),

    // hospital extension
    hospitalType: input.hospitalType ?? null,
    ownership: input.ownership ?? null,
    yearEstablished: input.yearEstablished ?? null,
    bedCapacity: input.bedCapacity ?? null,
    emergency: input.emergency ?? null,
    city: input.city ?? null,
    address: input.address ?? null,
    services: jsonOrNull(input.services),
    accreditation: jsonOrNull(input.accreditation),
    accreditationBody: input.accreditationBody ?? null,
    facilityBody: input.facilityBody ?? null,
    facilityNo: input.facilityNo ?? null,
    contactPhone: input.contactPhone ?? null,
    contactEmail: input.contactEmail ?? null,
  };
}

export type TaxonomyRefs = {
  industryId: string;
  regions: { regionId: string; isPrimary: boolean }[];
  tagIds: string[];
};

/**
 * Resolves the slugs the form submits into real row ids, returning a plain
 * error string instead of throwing so route handlers can 400 cleanly.
 */
export async function resolveTaxonomy(
  input: AdminCompanyInput,
): Promise<{ error: string } | { refs: TaxonomyRefs }> {
  const industry = await prisma.industry.findUnique({ where: { slug: input.industrySlug } });
  if (!industry) return { error: "That industry doesn't exist." };
  if (!industry.parentId) {
    return { error: "Pick a category under a vertical, not the vertical itself." };
  }

  const slugs = Array.from(new Set(input.regionSlugs));
  if (!slugs.includes(input.primaryRegionSlug)) {
    return { error: "The primary region must be one of the selected regions." };
  }
  const regionRows = await prisma.region.findMany({ where: { slug: { in: slugs } } });
  if (regionRows.length !== slugs.length) return { error: "One or more regions don't exist." };

  const tagSlugs = Array.from(new Set(input.tagSlugs ?? []));
  const tagRows = tagSlugs.length
    ? await prisma.feature.findMany({ where: { slug: { in: tagSlugs } } })
    : [];
  if (tagRows.length !== tagSlugs.length) return { error: "One or more tags don't exist." };

  return {
    refs: {
      industryId: industry.id,
      regions: regionRows.map((r) => ({
        regionId: r.id,
        isPrimary: r.slug === input.primaryRegionSlug,
      })),
      tagIds: tagRows.map((t) => t.id),
    },
  };
}

export async function createCompany(input: AdminCompanyInput, refs: TaxonomyRefs) {
  const slug = await uniqueSlug(input.slug || input.name);
  if (!slug) return { error: "That name can't be turned into a URL slug." as const };

  const company = await prisma.company.create({
    data: {
      ...companyScalarData(input),
      slug,
      industry: { connect: { id: refs.industryId } },
      regions: { create: refs.regions },
      tags: { connect: refs.tagIds.map((id) => ({ id })) },
      lastVerifiedAt: input.verification === "verified" ? new Date() : null,
    },
  });
  return { company };
}

export async function updateCompany(id: string, input: AdminCompanyInput, refs: TaxonomyRefs) {
  const existing = await prisma.company.findUnique({ where: { id } });
  if (!existing) return { error: "Company not found." as const };

  const slug = await uniqueSlug(input.slug || existing.slug, id);
  if (!slug) return { error: "That name can't be turned into a URL slug." as const };

  // Region/tag membership is replaced wholesale rather than diffed — the form
  // always submits the complete intended set, and doing it in one transaction
  // means a half-applied edit can't leave a listing with no regions.
  const company = await prisma.$transaction(async (tx) => {
    await tx.companyRegion.deleteMany({ where: { companyId: id } });
    return tx.company.update({
      where: { id },
      data: {
        ...companyScalarData(input),
        slug,
        industry: { connect: { id: refs.industryId } },
        regions: { create: refs.regions },
        tags: { set: refs.tagIds.map((tagId) => ({ id: tagId })) },
        lastVerifiedAt:
          input.verification === "verified"
            ? (existing.lastVerifiedAt ?? new Date())
            : null,
      },
    });
  });

  return { company };
}

// ---------------------------------------------------------------------------
// Rating aggregates
// ---------------------------------------------------------------------------

/**
 * Recomputes Company.ratingScore/ratingCount/ratingDist from *published*
 * reviews only, so moderation decisions are what move the public number.
 *
 * NOTE: the 11 seeded companies carry hand-entered demo aggregates (e.g.
 * ratingCount in the thousands) that were never backed by real Review rows.
 * The first time a review on one of those companies is published, that demo
 * number is replaced by the real count. That's intended — the displayed rating
 * should describe data the database actually holds — but it will visibly drop
 * those figures, so it's worth expecting rather than discovering.
 */
export async function recomputeRating(companyId: string) {
  const reviews = await prisma.review.findMany({
    where: { companyId, status: "published" },
    select: { rating: true },
  });

  if (!reviews.length) {
    await prisma.company.update({
      where: { id: companyId },
      data: { ratingScore: null, ratingCount: 0, ratingDist: Prisma.DbNull },
    });
    return;
  }

  const dist = [0, 0, 0, 0, 0];
  let total = 0;
  for (const r of reviews) {
    const clamped = Math.min(5, Math.max(1, r.rating));
    dist[clamped - 1] += 1;
    total += clamped;
  }

  await prisma.company.update({
    where: { id: companyId },
    data: {
      ratingScore: Number((total / reviews.length).toFixed(2)),
      ratingCount: reviews.length,
      ratingDist: dist,
    },
  });
}
