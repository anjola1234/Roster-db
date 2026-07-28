import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSubmissionSchema } from "@/lib/validation";
import { rateLimit, clientIpFrom } from "@/lib/rateLimit";

const PALETTE = ["#4F46E5", "#7C3AED", "#0F9D58", "#F5A623", "#00C3F7", "#E0356F", "#0E7C86", "#B42318"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function initialsFor(name: string) {
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

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

  const baseSlug = slugify(data.name);
  if (!baseSlug) {
    return NextResponse.json({ error: "Company name is invalid." }, { status: 400 });
  }
  let slug = baseSlug;
  let attempt = 1;
  while (await prisma.company.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
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
