import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { moderateReviewSchema } from "@/lib/validation";
import { recomputeRating } from "@/lib/companyWrite";
import { recordAudit } from "@/lib/audit";

const STATUS_FOR_ACTION = {
  publish: "published",
  reject: "rejected",
  remove: "removed",
  unpublish: "pending",
} as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = moderateReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const review = await prisma.review.findUnique({
    where: { id },
    select: {
      id: true,
      companyId: true,
      status: true,
      title: true,
      rating: true,
      company: { select: { name: true } },
    },
  });
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });

  const status = STATUS_FOR_ACTION[parsed.data.action];
  await prisma.review.update({ where: { id }, data: { status } });

  // The company's public rating is derived from published reviews only, so it
  // has to be recomputed on every transition in or out of "published".
  await recomputeRating(review.companyId);

  await recordAudit({
    actor: guard.user,
    action: `review.${parsed.data.action}`,
    entityType: "Review",
    entityId: review.id,
    targetLabel: `${review.rating}\u2605 "${review.title}" on ${review.company.name}`,
    changes: [{ field: "status", from: review.status, to: status }],
    summary: "Company rating recomputed from published reviews",
    reason: parsed.data.reason,
  });

  return NextResponse.json({ id, status });
}
