import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSubmissionSchema } from "@/lib/validation";
import { rateLimit, clientIpFrom } from "@/lib/rateLimit";
import { colorFor, initialsFor, uniqueSlug } from "@/lib/companyWrite";

export async function POST(request: NextRequest) {
  const ip = clientIpFrom(request);
  const limited = rateLimit(`products:${ip}`, { limit: 5, windowMs: 30 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = productSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const data = parsed.data;

  const industry = await prisma.industry.findUnique({ where: { slug: data.industrySlug } });
  if (!industry || !industry.parentId) {
    return NextResponse.json({ error: "Pick a valid industry sub-vertical." }, { status: 400 });
  }
  const region = await prisma.region.findUnique({ where: { slug: data.regionSlug } });
  if (!region) {
    return NextResponse.json({ error: "Pick a valid region." }, { status: 400 });
  }

  const slug = await uniqueSlug(data.name);
  if (!slug) {
    return NextResponse.json({ error: "Company name is invalid." }, { status: 400 });
  }

  const company = await prisma.company.create({
    data: {
      slug,
      name: data.name,
      logoInitials: initialsFor(data.name),
      logoColor: colorFor(data.name),
      industryId: industry.id,
      shortDescription: data.shortDescription,
      longDescription: data.longDescription,
      website: data.website,
      status: "pending",
      verification: "unverified",
      submittedByEmail: data.submittedByEmail,
      city: data.city || null,
      source: "Submitted via List Your Product",
      regions: { create: { regionId: region.id, isPrimary: true } },
    },
  });

  return NextResponse.json({ slug: company.slug }, { status: 201 });
}
