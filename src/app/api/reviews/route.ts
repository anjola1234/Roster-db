import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validation";
import { rateLimit, clientIpFrom } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
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
      authorName,
      authorRole,
      rating,
      title,
      body: reviewBody,
    },
  });

  return NextResponse.json({ id: review.id }, { status: 201 });
}
