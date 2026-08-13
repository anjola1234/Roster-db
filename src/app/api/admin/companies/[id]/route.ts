import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { adminCompanySchema } from "@/lib/validation";
import { resolveTaxonomy, updateCompany } from "@/lib/companyWrite";

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

  const result = await updateCompany(id, parsed.data, taxonomy.refs);
  if ("error" in result) {
    const status = result.error === "Company not found." ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ id: result.company.id, slug: result.company.slug });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id }, select: { id: true } });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  // Hard delete, which cascades to reviews/regions/claims/signals per the
  // schema's onDelete rules. Archiving (status="archived") is the reversible
  // option and is what the moderation actions use — this endpoint exists for
  // genuine mistakes like a duplicate or spam listing.
  await prisma.company.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
