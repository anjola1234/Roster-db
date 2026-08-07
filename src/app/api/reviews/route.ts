import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validation";
import { rateLimit, clientIpFrom } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/session";

// New review submissions require a real, logged-in session (a genuine
// behavior change — reviews used to publish immediately with no auth or
// moderation). They're inserted as status="pending" and only ever surfaced
// publicly once an admin flips them to "published"; see the review-queue
// workflow described in the schema doc (not built in this pass).
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to post a review." }, { status: 401 });
  }

  const ip = clientIpFrom(request);
  const limited = rateLimit(`reviews:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const { companySlug, authorName, authorRole, rating, title, body: reviewBody } = parsed.data;

  const company = await prisma.company.findUnique({ where: { slug: companySlug } });
  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const review = await prisma.review.create({
    data: {
      companyId: company.id,
      userId: user.id,
      authorName,
      authorRole,
      rating,
      title,
      body: reviewBody,
      status: "pending",
    },
  });

  return NextResponse.json({ id: review.id, status: "pending" }, { status: 201 });
}
