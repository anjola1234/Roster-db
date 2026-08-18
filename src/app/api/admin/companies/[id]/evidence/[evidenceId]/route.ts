import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { evidenceActionSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { labelForFieldKey } from "@/lib/evidence";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; evidenceId: string }> },
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id, evidenceId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = evidenceActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const row = await prisma.fieldProvenance.findFirst({
    where: { id: evidenceId, companyId: id },
    include: { company: { select: { name: true } }, source: { select: { name: true } } },
  });
  if (!row) return NextResponse.json({ error: "Evidence not found." }, { status: 404 });

  const now = new Date();
  const label = `${labelForFieldKey(row.fieldKey)} on ${row.company.name}`;

  if (parsed.data.action === "delete") {
    // Logged before the delete — afterwards there is nothing left to describe.
    await recordAudit({
      actor: guard.user,
      action: "evidence.delete",
      entityType: "Company",
      entityId: id,
      targetLabel: label,
      summary: `Removed evidence from ${row.source.name}`,
      evidence: row.sourceUrl ? [row.sourceUrl] : undefined,
    });
    await prisma.fieldProvenance.delete({ where: { id: evidenceId } });
    return NextResponse.json({ deleted: true });
  }

  if (parsed.data.action === "set-winning") {
    await prisma.$transaction([
      prisma.fieldProvenance.updateMany({
        where: { companyId: id, fieldKey: row.fieldKey },
        data: { isWinning: false },
      }),
      prisma.fieldProvenance.update({ where: { id: evidenceId }, data: { isWinning: true } }),
    ]);
    await recordAudit({
      actor: guard.user,
      action: "evidence.set-winning",
      entityType: "Company",
      entityId: id,
      targetLabel: label,
      summary: `${row.source.name} set as the authoritative source for this field`,
    });
    return NextResponse.json({ isWinning: true });
  }

  const verify = parsed.data.action === "verify";
  await prisma.fieldProvenance.update({
    where: { id: evidenceId },
    data: {
      verifiedById: verify ? guard.user.id : null,
      verifiedAt: verify ? now : null,
    },
  });

  await recordAudit({
    actor: guard.user,
    action: verify ? "evidence.verify" : "evidence.unverify",
    entityType: "Company",
    entityId: id,
    targetLabel: label,
    summary: verify
      ? `Confirmed against ${row.source.name}`
      : `Verification withdrawn; value retained as unverified`,
  });

  return NextResponse.json({ verified: verify });
}
