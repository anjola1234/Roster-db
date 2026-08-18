import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { evidenceSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { labelForFieldKey } from "@/lib/evidence";

/** Attaches a piece of evidence to one field of one company (spec §14). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = evidenceSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Invalid input.", field: issue?.path.join(".") },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const company = await prisma.company.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  const source = await prisma.dataSource.findUnique({ where: { key: data.sourceKey } });
  if (!source) return NextResponse.json({ error: "That source doesn't exist." }, { status: 400 });

  const now = new Date();

  const created = await prisma.$transaction(async (tx) => {
    // Only one row per field can be the winning value, so promoting this one
    // demotes the rest. Without this the profile would have no way to decide
    // which of three conflicting sources to believe.
    if (data.isWinning) {
      await tx.fieldProvenance.updateMany({
        where: { companyId: id, fieldKey: data.fieldKey },
        data: { isWinning: false },
      });
    }
    return tx.fieldProvenance.create({
      data: {
        companyId: id,
        fieldKey: data.fieldKey,
        valueText: data.valueText,
        sourceId: source.id,
        sourceUrl: data.sourceUrl ?? null,
        confidence: data.confidence ?? null,
        note: data.note ?? null,
        isWinning: data.isWinning ?? false,
        fetchedAt: now,
        // Verification is a separate, explicit act — recording a source does
        // not by itself make the value verified (spec §29).
        verifiedById: data.verifyNow ? guard.user.id : null,
        verifiedAt: data.verifyNow ? now : null,
      },
    });
  });

  await recordAudit({
    actor: guard.user,
    action: "evidence.add",
    entityType: "Company",
    entityId: company.id,
    targetLabel: `${labelForFieldKey(data.fieldKey)} on ${company.name}`,
    summary: `Evidence from ${source.name}${data.isWinning ? " (set as authoritative)" : ""}${data.verifyNow ? " and verified" : ""}`,
    reason: data.note,
    evidence: data.sourceUrl ? [data.sourceUrl] : undefined,
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
