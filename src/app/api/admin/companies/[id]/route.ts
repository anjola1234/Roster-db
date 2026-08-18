import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { adminCompanySchema } from "@/lib/validation";
import { resolveTaxonomy, updateCompany } from "@/lib/companyWrite";
import { diffRecords, recordAudit } from "@/lib/audit";

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

  const parsed = adminCompanySchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Invalid input.", field: issue?.path.join(".") },
      { status: 400 },
    );
  }

  const taxonomy = await resolveTaxonomy(parsed.data);
  if ("error" in taxonomy) {
    return NextResponse.json({ error: taxonomy.error }, { status: 400 });
  }

  // Snapshot before the write so the log can show what actually changed.
  const before = await prisma.company.findUnique({ where: { id } });

  const result = await updateCompany(id, parsed.data, taxonomy.refs);
  if ("error" in result) {
    const status = result.error === "Company not found." ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  await recordAudit({
    actor: guard.user,
    action: "company.update",
    entityType: "Company",
    entityId: result.company.id,
    targetLabel: result.company.name,
    changes: before
      ? diffRecords(before as Record<string, unknown>, result.company as Record<string, unknown>)
      : undefined,
  });

  return NextResponse.json({ id: result.company.id, slug: result.company.slug });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, status: true, _count: { select: { reviews: true, claims: true } } },
  });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  // Hard delete, which cascades to reviews/regions/claims/signals per the
  // schema's onDelete rules. Archiving (status="archived") is the reversible
  // option and is what the moderation actions use — this endpoint exists for
  // genuine mistakes like a duplicate or spam listing.
  // Logged BEFORE the delete: afterwards there is no row left to describe,
  // and a deletion is exactly the action an audit trail exists to capture.
  await recordAudit({
    actor: guard.user,
    action: "company.delete",
    entityType: "Company",
    entityId: company.id,
    targetLabel: company.name,
    summary: `Hard-deleted /${company.slug} (was ${company.status}); cascaded ${company._count.reviews} review(s) and ${company._count.claims} claim(s)`,
  });

  await prisma.company.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
