import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Shared "full company" include used by directory + detail views.
// ---------------------------------------------------------------------------
export const companyInclude = {
  industry: { include: { parent: true } },
  regions: { include: { region: true } },
  tags: true,
  investors: { include: { investor: true, fundingRound: true } },
  fundingRounds: true,
  listingPeople: { include: { person: true } },
  reviews: { where: { status: "published" as const }, orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.CompanyInclude;

export type CompanyFull = Prisma.CompanyGetPayload<{ include: typeof companyInclude }>;

export type CompanyFilters = {
  vertical?: string; // top-level industry slug, e.g. "fintech"
  industry?: string; // leaf industry slug, e.g. "fintech-payments"
  region?: string; // region slug
  status?: string; // "verified" | "unverified" | "flagged"
  tags?: string[]; // feature slugs, AND semantics
  q?: string;
};

function buildWhere(filters: CompanyFilters): Prisma.CompanyWhereInput {
  const AND: Prisma.CompanyWhereInput[] = [];

  if (filters.industry) {
    AND.push({ industry: { slug: filters.industry } });
  } else if (filters.vertical) {
    AND.push({ industry: { parent: { slug: filters.vertical } } });
  }

  if (filters.region) {
    AND.push({ regions: { some: { region: { slug: filters.region } } } });
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

  return AND.length ? { AND } : {};
}

export async function getCompanies(filters: CompanyFilters = {}) {
  const where = buildWhere(filters);
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
  return prisma.company.findUnique({ where: { slug }, include: companyInclude });
}

export async function getRelatedCompanies(company: CompanyFull, limit = 3) {
  return prisma.company.findMany({
    where: {
      industry: { parentId: company.industry.parentId ?? company.industry.id },
      slug: { not: company.slug },
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
      prisma.company.count(),
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
    include: companyInclude,
    orderBy: [{ verification: "desc" }, { name: "asc" }],
    take: limit,
  });
  return rows;
}

export async function getReviewDeck(limit = 15) {
  return prisma.review.findMany({
    where: { status: "published" },
    include: { company: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getHeroFragments(limit = 18) {
  return prisma.company.findMany({
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
