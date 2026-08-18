import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { checkAllCompanies, checkCompanyWebsite } from "@/lib/activityCheck";
import { recordAudit } from "@/lib/audit";

export const maxDuration = 300;

/**
 * Runs the real website checker on demand from the admin dashboard.
 *
 * Body: { companyId } to check one listing, or {} to check every operating /
 * unverified listing. The nightly Vercel cron hits the same underlying
 * function at /api/cron/check-activity — this endpoint exists so an admin
 * doesn't have to wait until 6am to find out whether a listing's site is up,
 * and so newly-seeded listings can be confirmed live immediately.
 *
 * Each check is a genuine outbound HTTP GET, so a full run takes roughly
 * (listings / 5) x up-to-10s. That's why maxDuration is raised; on a very
 * large directory this should move to a queue rather than a request.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  let body: { companyId?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body means "check everything" — not an error.
  }

  if (body.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: body.companyId },
      select: { id: true, website: true, websiteContentHash: true, lifecycleStatus: true },
    });
    if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

    try {
      const result = await checkCompanyWebsite(company);
      const updated = await prisma.company.findUnique({
        where: { id: company.id },
        select: { activityScore: true, activityLabel: true, websiteStatus: true, websiteLastCheckedAt: true },
      });
      return NextResponse.json({ scope: "single", ...result, ...updated });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Check failed." },
        { status: 500 },
      );
    }
  }

  const summary = await checkAllCompanies();

  // The full sweep is logged; single checks are not. A per-listing check is
  // read-only diagnostics an admin runs constantly, and logging each one would
  // drown the decisions that actually matter. The WebsiteCheck table already
  // holds the per-listing history.
  await recordAudit({
    actor: guard.user,
    action: "activity.check",
    entityType: "Company",
    entityId: "all",
    targetLabel: `Website sweep across ${summary.total} listing(s)`,
    summary: `${summary.reachable} reachable, ${summary.unreachable} unreachable, ${summary.parked} parked, ${summary.error} errored`,
  });

  return NextResponse.json({ scope: "all", ...summary });
}
