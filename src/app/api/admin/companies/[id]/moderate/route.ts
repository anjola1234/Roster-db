import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { moderateCompanySchema } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma/client";

/**
 * One-click state changes for a listing, kept separate from the full edit
 * endpoint so a queue button can't accidentally blank out fields it didn't
 * send. Each action maps to an explicit, complete set of column writes.
 */
export async function POST(
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

  const parsed = moderateCompanySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const company = await prisma.company.findUnique({ where: { id }, select: { id: true } });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  const now = new Date();
  const updates: Record<string, Prisma.CompanyUpdateInput> = {
    // Publish a pending submission to the live directory.
    approve: { status: "active", verification: "verified", lastVerifiedAt: now },
    // Reject without deleting: keeps the record (and the submitter's email)
    // for audit, but takes it out of every public query.
    reject: { status: "archived", verification: "unverified" },
    verify: { verification: "verified", lastVerifiedAt: now },
    unverify: { verification: "unverified", lastVerifiedAt: null },
    flag: { verification: "flagged" },
    archive: { status: "archived" },
    restore: { status: "active" },
  };

  const updated = await prisma.company.update({
    where: { id },
    data: updates[parsed.data.action],
    select: { id: true, status: true, verification: true },
  });

  return NextResponse.json(updated);
}
