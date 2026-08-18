import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { moderateClaimSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

const STATUS_FOR_ACTION = {
  approve: "approved",
  reject: "rejected",
  revoke: "revoked",
} as const;

/**
 * Decides an ownership claim — the "verify the user who listed this company"
 * step. Approving does three things atomically:
 *   1. marks the claim approved and records who decided it,
 *   2. writes a ListingVerification badge row (the durable evidence trail),
 *   3. flips the listing itself to verified.
 * Rejecting only touches the claim: the listing's own verification state is a
 * separate editorial judgement and shouldn't be undone by one bad claimant.
 */
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

  const parsed = moderateClaimSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const { action, note } = parsed.data;

  const claim = await prisma.listingClaim.findUnique({
    where: { id },
    select: {
      id: true,
      companyId: true,
      userId: true,
      proofMethod: true,
      claimedRole: true,
      status: true,
      company: { select: { name: true } },
      user: { select: { email: true } },
    },
  });
  if (!claim) return NextResponse.json({ error: "Claim not found." }, { status: 404 });

  const now = new Date();
  const status = STATUS_FOR_ACTION[action];

  await prisma.$transaction(async (tx) => {
    await tx.listingClaim.update({
      where: { id },
      data: { status, decidedById: guard.user.id, decidedAt: now },
    });

    if (action === "approve") {
      await tx.listingVerification.create({
        data: {
          companyId: claim.companyId,
          badgeType: "claimed",
          status: "verified",
          method: claim.proofMethod === "work_email" ? "email_link" : claim.proofMethod,
          verifiedById: guard.user.id,
          verifiedAt: now,
          note: note ?? null,
        },
      });
      await tx.company.update({
        where: { id: claim.companyId },
        data: { verification: "verified", lastVerifiedAt: now },
      });
    }

    if (action === "revoke") {
      await tx.listingVerification.updateMany({
        where: { companyId: claim.companyId, badgeType: "claimed", status: "verified" },
        data: { status: "expired", note: note ?? null },
      });
    }
  });

  await recordAudit({
    actor: guard.user,
    action: `claim.${action}`,
    entityType: "ListingClaim",
    entityId: claim.id,
    targetLabel: `${claim.user.email} \u2192 ${claim.company.name}`,
    changes: [{ field: "status", from: claim.status, to: status }],
    summary:
      action === "approve"
        ? `Verification badge issued (claimed role: ${claim.claimedRole}, proof: ${claim.proofMethod}); listing marked verified`
        : `Claim ${status}; listing verification left unchanged`,
    reason: note,
  });

  return NextResponse.json({ id, status });
}
