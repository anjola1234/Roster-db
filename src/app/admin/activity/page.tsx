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
      // Latest computed score carries the coverage figure and per-signal
      // contributions, so the number can be explained rather than asserted.
      scores: {
        where: { scoreType: "activity" },
        orderBy: { computedAt: "desc" },
        take: 1,
        select: { coverage: true, componentsJson: true, computedAt: true },
      },
    },
    // Never-checked listings first — those are the ones needing attention.
    orderBy: [{ websiteLastCheckedAt: { sort: "asc", nulls: "first" } }, { name: "asc" }],
  });

  return <AdminActivity companies={companies} />;
}
