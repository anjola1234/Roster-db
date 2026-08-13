import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { importPayloadSchema, importRowSchema } from "@/lib/validation";
import { colorFor, initialsFor, uniqueSlug } from "@/lib/companyWrite";

export type ImportRowResult = {
  row: number; // 1-based, matching the spreadsheet row the admin is looking at
  name: string;
  ok: boolean;
  error?: string;
  slug?: string;
};

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = importPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const { rows, mode, status } = parsed.data;

  // Load the taxonomy once rather than per row — a 500-row import shouldn't
  // mean 1000 lookups.
  const [industries, regions] = await Promise.all([
    prisma.industry.findMany({ select: { id: true, slug: true, parentId: true } }),
    prisma.region.findMany({ select: { id: true, slug: true } }),
  ]);
  const industryBySlug = new Map(industries.map((i) => [i.slug, i]));
  const regionBySlug = new Map(regions.map((r) => [r.slug, r]));

  const results: ImportRowResult[] = [];
  // Tracks slugs claimed earlier in *this* file so two identically-named rows
  // in one upload don't both resolve to the same free slug.
  const claimedSlugs = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 1;
    const raw = rows[i] as Record<string, unknown>;
    const name = typeof raw?.name === "string" ? raw.name : `Row ${rowNumber}`;

    const rowParsed = importRowSchema.safeParse(raw);
    if (!rowParsed.success) {
      const issue = rowParsed.error.issues[0];
      results.push({
        row: rowNumber,
        name,
        ok: false,
        error: `${issue?.path.join(".") || "row"}: ${issue?.message ?? "invalid"}`,
      });
      continue;
    }
    const data = rowParsed.data;

    const industry = industryBySlug.get(data.industrySlug);
    if (!industry) {
      results.push({ row: rowNumber, name, ok: false, error: `Unknown industry "${data.industrySlug}"` });
      continue;
    }
    if (!industry.parentId) {
      results.push({
        row: rowNumber,
        name,
        ok: false,
        error: `"${data.industrySlug}" is a top-level vertical — use one of its categories`,
      });
      continue;
    }
    const region = regionBySlug.get(data.regionSlug);
    if (!region) {
      results.push({ row: rowNumber, name, ok: false, error: `Unknown region "${data.regionSlug}"` });
      continue;
    }

    let slug = await uniqueSlug(data.name);
    if (!slug) {
      results.push({ row: rowNumber, name, ok: false, error: "Name can't be turned into a URL slug" });
      continue;
    }
    let bump = 1;
    while (claimedSlugs.has(slug)) {
      bump += 1;
      slug = `${await uniqueSlug(data.name)}-${bump}`;
    }
    claimedSlugs.add(slug);

    if (mode === "validate") {
      results.push({ row: rowNumber, name: data.name, ok: true, slug });
      continue;
    }

    try {
      await prisma.company.create({
        data: {
          slug,
          name: data.name,
          logoInitials: initialsFor(data.name),
          logoColor: colorFor(data.name),
          industryId: industry.id,
          shortDescription: data.shortDescription,
          longDescription: data.longDescription,
          website: data.website,
          city: data.city ?? null,
          foundingYear: data.foundingYear ?? null,
          status,
          verification: "unverified",
          source: "Admin bulk import",
          regions: { create: { regionId: region.id, isPrimary: true } },
        },
      });
      results.push({ row: rowNumber, name: data.name, ok: true, slug });
    } catch {
      results.push({ row: rowNumber, name: data.name, ok: false, error: "Database rejected this row" });
    }
  }

  const created = results.filter((r) => r.ok).length;
  return NextResponse.json({
    mode,
    status,
    total: results.length,
    ok: created,
    failed: results.length - created,
    results,
  });
}
