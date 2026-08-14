import { prisma } from "@/lib/prisma";
import AdminActivity from "@/components/admin/AdminActivity";

export default async function AdminActivityPage() {
  const companies = await prisma.company.findMany({
    where: { status: "active" },
    select: {
      id: true,
      slug: true,
      name: true,
      website: true,
      lifecycleStatus: true,
      activityScore: true,
      activityLabel: true,
      websiteStatus: true,
      websiteLastCheckedAt: true,
      _count: { select: { websiteChecks: true } },
    },
    // Never-checked listings first — those are the ones needing attention.
    orderBy: [{ websiteLastCheckedAt: { sort: "asc", nulls: "first" } }, { name: "asc" }],
  });

  return <AdminActivity companies={companies} />;
}
