import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { claimSubmissionSchema } from "@/lib/validation";
import { rateLimit, clientIpFrom } from "@/lib/rateLimit";

/**
 * Lets a signed-in user assert they represent a company. This is the front
 * door to the admin claims queue — without it that queue would have nothing
 * to review, since nothing else in the app writes ListingClaim rows.
 *
 * It records an assertion, never a verified fact: status is always "pending"
 * and only an admin decision can turn it into a badge.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to claim a listing." }, { status: 401 });
  }

  const ip = clientIpFrom(request);
  const limited = rateLimit(`claims:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = claimSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const { companySlug, claimedRole, proofMethod } = parsed.data;

  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true },
  });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  const existing = await prisma.listingClaim.findFirst({
    where: { companyId: company.id, userId: user.id, status: { in: ["pending", "approved"] } },
    select: { status: true },
  });
  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.status === "approved"
            ? "You've already been verified for this listing."
            : "You already have a claim pending on this listing.",
      },
      { status: 409 },
    );
  }

  const claim = await prisma.listingClaim.create({
    data: { companyId: company.id, userId: user.id, claimedRole, proofMethod, status: "pending" },
  });

  return NextResponse.json({ id: claim.id, status: claim.status }, { status: 201 });
}
