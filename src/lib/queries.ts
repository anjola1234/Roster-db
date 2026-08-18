import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Shared "full company" include used by directory + detail views.
// ---------------------------------------------------------------------------
/**
 * Only "active" listings are public.
 *
 * This filter was missing entirely before the admin dashboard existed, which
 * meant every public submission (created with status="pending") was already
 * live on the directory the moment it was submitted — the opposite of what
 * PROJECT_OVERVIEW section 5 described. Drafts, pending submissions and
 * archived listings are now all excluded from public reads; the admin views
 * use their own queries in adminQueries.ts and are unaffected.
 */
export const PUBLIC_STATUS = "active";

export const companyInclude = {
  industry: { include: { parent: true } },
  regions: { include: { region: true } },
  tags: true,
  investors: { include: { investor: true, fundingRound: true } },
  fundingRounds: true,
  listingPeople: { include: { person: true } },
  reviews: { where: { status: "published" as const }, orderBy: { createdAt: "desc" as const } },
  // Evidence behind the facts on the profile (spec sections 13, 14, 24).
  // Only rows marked authoritative surface publicly — the losing side of a
  // source conflict is an internal working detail, visible in the admin
  // evidence screen, not something to publish as though it were competing
  // truth.
  fieldProvenance: {
    where: { isWinning: true },
    include: { source: { select: { name: true, kind: true } } },
    orderBy: { fieldKey: "asc" as const },
  },
} satisfies Prisma.CompanyInclude;

export type CompanyFull = Prisma.CompanyGetPayload<{ include: typeof companyInclude }>;

export type CompanyFilters = {
  vertical?: string; // top-level industry slug, e.g. "fintech"
  industry?: string; // leaf industry slug, e.g. "fintech-payments"
  region?: string; // region slug — country, state or city
  /** Internal: `region` plus every descendant slug, filled in by expandRegionScope. */
  regionScope?: string[];
  status?: string; // "verified" | "unverified" | "flagged"
  tags?: string[]; // feature slugs, AND semantics
  q?: string;
};

function buildWhere(filters: CompanyFilters): Prisma.CompanyWhereInput {
  const AND: Prisma.CompanyWhereInput[] = [{ status: PUBLIC_STATUS }];

  if (filters.industry) {
    AND.push({ industry: { slug: filters.industry } });
  } else if (filters.vertical) {
    AND.push({ industry: { parent: { slug: filters.vertical } } });
  }

  if (filters.region) {
    // Region filtering is hierarchical. Listings attach to states, so an
    // exact-slug match meant "Nigeria" and "Ikeja" both returned nothing.
    // regionScope is resolved by the caller (it needs a query) and holds the
    // region plus all of its descendants; falling back to the bare slug keeps
    // this correct if a caller hasn't resolved it.
    const slugs = filters.regionScope?.length ? filters.regionScope : [filters.region];
    AND.push({ regions: { some: { region: { slug: { in: slugs } } } } });
  }

  if (filters.status) {
    AND.push({ verification: filters.status });
  }

  if (filters.tags?.length) {
    for (const tag of filters.tags) {
      AND.push({ tags: { some: { slug: tag } } });
    }
  }

  if (filters.q) {
    const q = filters.q;
    AND.push({
      OR: [
        { name: { contains: q } },
        { shortDescription: { contains: q } },
        { longDescription: { contains: q } },
        { tags: { some: { name: { contains: q } } } },
      ],
    });
  }

  return { AND };
}

/**
 * Expands a region slug into itself plus all descendants, so filtering by
 * "ng" catches every state and city under Nigeria and filtering by a state
 * catches its cities. Two levels is enough for the country > state > city
 * hierarchy the seed uses.
 */
export async function expandRegionScope(slug: string): Promise<string[]> {
  const root = await prisma.region.findUnique({
    where: { slug },
    select: { slug: true, children: { select: { slug: true, children: { select: { slug: true } } } } },
  });
  if (!root) return [slug];
  const slugs = [root.slug];
  for (const child of root.children) {
    slugs.push(child.slug);
    for (const grandchild of child.children) slugs.push(grandchild.slug);
  }
  return slugs;
}

export async function getCompanies(filters: CompanyFilters = {}) {
  const resolved: CompanyFilters = filters.region
    ? { ...filters, regionScope: await expandRegionScope(filters.region) }
    : filters;
  const where = buildWhere(resolved);
  return prisma.company.findMany({ where, include: companyInclude });
}

export function sortCompanies(rows: CompanyFull[], sort: string | undefined) {
  const sorted = [...rows];
  if (sort === "funding") {
    sorted.sort((a, b) => (b.totalFunding ?? 0) - (a.totalFunding ?? 0));
  } else if (sort === "beds") {
    sorted.sort((a, b) => (b.bedCapacity ?? 0) - (a.bedCapacity ?? 0));
  } else if (sort === "newest") {
    sorted.sort(
      (a, b) =>
        (b.foundingYear ?? b.yearEstablished ?? 0) -
        (a.foundingYear ?? a.yearEstablished ?? 0),
    );
  } else {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
}

export async function getCompanyBySlug(slug: string): Promise<CompanyFull | null> {
  // findFirst, not findUnique: the status filter means a draft/pending listing
  // resolves to null here and the public page 404s. Admins edit those through
  // /admin/companies/[id], which reads them directly.
  return prisma.company.findFirst({
    where: { slug, status: PUBLIC_STATUS },
    include: companyInclude,
  });
}

export async function getRelatedCompanies(company: CompanyFull, limit = 3) {
  return prisma.company.findMany({
    where: {
      industry: { parentId: company.industry.parentId ?? company.industry.id },
      slug: { not: company.slug },
      status: PUBLIC_STATUS,
    },
    include: companyInclude,
    take: limit,
  });
}

export async function getIndustries() {
  const verticals = await prisma.industry.findMany({
    where: { parentId: null },
    include: { children: true },
    orderBy: { name: "asc" },
  });
  return verticals;
}

// Directory/filter UI only ever wants a flat pickable list — the state level
// of the region tree (the doc's region_taxonomy also has country and city
// levels, used for future breadcrumb-style URLs, not this filter UI).
export async function getRegions(level: string = "state") {
  return prisma.region.findMany({ where: { level }, orderBy: { name: "asc" } });
}

/**
 * Every region that actually has listings under it, ordered country > state >
 * city, for the directory's region picker. Regions with nothing in them are
 * left out — offering a filter that can only ever return zero results is
 * worse than not offering it.
 */
export async function getRegionTree() {
  const rows = await prisma.region.findMany({
    select: {
      slug: true,
      name: true,
      level: true,
      parent: { select: { slug: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const counts = await prisma.companyRegion.groupBy({
    by: ["regionId"],
    _count: { companyId: true },
  });
  const withListings = new Set(counts.map((c) => c.regionId));
  const idBySlug = await prisma.region.findMany({ select: { id: true, slug: true } });
  const slugById = new Map(idBySlug.map((r) => [r.id, r.slug]));
  const populated = new Set(Array.from(withListings).map((id) => slugById.get(id)!));

  // A country or state counts as populated if anything beneath it is.
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  for (const row of rows) {
    if (!populated.has(row.slug)) continue;
    let parent = row.parent?.slug;
    while (parent) {
      populated.add(parent);
      parent = bySlug.get(parent)?.parent?.slug;
    }
  }

  const order = { country: 0, state: 1, city: 2 } as Record<string, number>;
  return rows
    .filter((r) => populated.has(r.slug))
    .sort((a, b) => (order[a.level] ?? 9) - (order[b.level] ?? 9) || a.name.localeCompare(b.name));
}

export async function getFeatures(verticalSlug?: string) {
  return prisma.feature.findMany({
    where: verticalSlug ? { industry: { slug: verticalSlug } } : undefined,
    include: { industry: { select: { slug: true } } },
    orderBy: [{ group: "asc" }, { name: "asc" }],
  });
}

// ---------------------------------------------------------------------------
// Homepage: ecosystem statistics (real Prisma aggregate counts, never
// hardcoded — this is a Nigeria-only pilot so we report "States", not a
// fabricated worldwide country count).
// ---------------------------------------------------------------------------
export async function getEcosystemStats() {
  const [companies, reviews, investors, regions, industries, people, features] =
    await Promise.all([
      prisma.company.count({ where: { status: PUBLIC_STATUS } }),
      prisma.review.count({ where: { status: "published" } }),
      prisma.investor.count(),
      // "States" on the homepage — the state level of the region tree, not
      // the whole country/state/city tree.
      prisma.region.count({ where: { level: "state" } }),
      prisma.industry.count(),
      // One row per (person, company) listing — matches the old Person shape
      // where a founder was one row per company they founded.
      prisma.listingPerson.count(),
      prisma.feature.count(),
    ]);
  return { companies, reviews, investors, regions, industries, people, features };
}

export async function getTopCompaniesPreview(limit = 10) {
  const rows = await prisma.company.findMany({
    where: { status: PUBLIC_STATUS },
    include: companyInclude,
    orderBy: [{ verification: "desc" }, { name: "asc" }],
    take: limit,
  });
  return rows;
}

export async function getReviewDeck(limit = 15) {
  return prisma.review.findMany({
    // Both halves matter: a published review attached to a draft or archived
    // listing would otherwise surface the listing's name on the homepage.
    where: { status: "published", company: { status: PUBLIC_STATUS } },
    include: { company: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getHeroFragments(limit = 18) {
  return prisma.company.findMany({
    where: { status: PUBLIC_STATUS },
    select: {
      name: true,
      logoInitials: true,
      logoColor: true,
      slug: true,
      industry: { select: { name: true, parent: { select: { name: true } } } },
    },
    take: limit,
  });
}
