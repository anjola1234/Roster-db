import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/** Counts driving the dashboard tiles and the nav's queue badges. */
export async function getQueueCounts() {
  const [pendingCompanies, pendingReviews, pendingClaims, flagged, drafts, total] =
    await Promise.all([
      prisma.company.count({ where: { status: "pending" } }),
      prisma.review.count({ where: { status: "pending" } }),
      prisma.listingClaim.count({ where: { status: "pending" } }),
      prisma.company.count({ where: { verification: "flagged" } }),
      prisma.company.count({ where: { status: "draft" } }),
      prisma.company.count(),
    ]);
  return { pendingCompanies, pendingReviews, pendingClaims, flagged, drafts, total };
}

export type AdminCompanyFilters = {
  status?: string;
  verification?: string;
  q?: string;
};

const adminCompanySelect = {
  id: true,
  slug: true,
  name: true,
  logoInitials: true,
  logoColor: true,
  status: true,
  verification: true,
  lifecycleStatus: true,
  website: true,
  submittedByEmail: true,
  createdAt: true,
  lastVerifiedAt: true,
  industry: { select: { name: true, parent: { select: { name: true } } } },
  regions: { select: { isPrimary: true, region: { select: { name: true } } } },
  _count: { select: { reviews: true, claims: true } },
} satisfies Prisma.CompanySelect;

export type AdminCompanyRow = Prisma.CompanyGetPayload<{ select: typeof adminCompanySelect }>;

export async function getAdminCompanies(filters: AdminCompanyFilters = {}, take = 200) {
  const AND: Prisma.CompanyWhereInput[] = [];
  if (filters.status) AND.push({ status: filters.status });
  if (filters.verification) AND.push({ verification: filters.verification });
  if (filters.q) {
    AND.push({
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { slug: { contains: filters.q, mode: "insensitive" } },
        { submittedByEmail: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }

  return prisma.company.findMany({
    where: AND.length ? { AND } : {},
    select: adminCompanySelect,
    // Newest first: the admin view is a work queue, not an A-Z browse.
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getAdminCompanyById(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      industry: { select: { slug: true } },
      regions: { select: { isPrimary: true, region: { select: { slug: true } } } },
      tags: { select: { slug: true } },
    },
  });
}

export async function getPendingSubmissions() {
  return prisma.company.findMany({
    where: { status: "pending" },
    select: adminCompanySelect,
    orderBy: { createdAt: "asc" }, // oldest first — nothing should rot at the bottom
  });
}

export async function getReviewQueue(status = "pending") {
  return prisma.review.findMany({
    where: { status },
    include: {
      company: { select: { name: true, slug: true } },
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
}

export type AdminReviewRow = Awaited<ReturnType<typeof getReviewQueue>>[number];

export async function getClaimQueue(status = "pending") {
  return prisma.listingClaim.findMany({
    where: { status },
    include: {
      company: {
        select: { name: true, slug: true, website: true, verification: true, submittedByEmail: true },
      },
      user: { select: { id: true, email: true, name: true, createdAt: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
}

export type AdminClaimRow = Awaited<ReturnType<typeof getClaimQueue>>[number];

/** Taxonomy options for the company form's selects. */
export async function getFormOptions() {
  const [verticals, regions, features] = await Promise.all([
    prisma.industry.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.region.findMany({ where: { level: "state" }, orderBy: { name: "asc" } }),
    prisma.feature.findMany({
      include: { industry: { select: { slug: true, name: true } } },
      orderBy: [{ group: "asc" }, { name: "asc" }],
    }),
  ]);
  return { verticals, regions, features };
}

export type FormOptions = Awaited<ReturnType<typeof getFormOptions>>;
