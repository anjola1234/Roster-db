import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PUBLIC_STATUS, companyInclude, type CompanyFull } from "@/lib/queries";
import { MAX_COMPARE, buildCompareRows, comparabilityNote } from "@/lib/compare";
import CompareTable from "@/components/CompareTable";
import ComparePicker from "@/components/ComparePicker";

export const metadata: Metadata = {
  title: "Compare companies — IndexOne",
  description: "Compare companies side by side on sector-appropriate criteria.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const slugs = (c ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE);

  const found = slugs.length
    ? await prisma.company.findMany({
        where: { slug: { in: slugs }, status: PUBLIC_STATUS },
        include: companyInclude,
      })
    : [];

  // Preserve the order the URL asked for, so the columns don't reshuffle.
  const companies = slugs
    .map((s) => found.find((f) => f.slug === s))
    .filter(Boolean) as CompanyFull[];

  const missing = slugs.filter((s) => !found.some((f) => f.slug === s));

  const options = await prisma.company.findMany({
    where: { status: PUBLIC_STATUS },
    select: {
      slug: true,
      name: true,
      industry: { select: { name: true, parent: { select: { name: true } } } },
    },
    orderBy: { name: "asc" },
  });

  const rows = buildCompareRows(companies);
  const note = comparabilityNote(companies);

  return (
    <main className="compare-page">
      <div className="wrap">
        <header className="compare-head">
          <span className="eyebrow">Compare</span>
          <h1>Side by side</h1>
          <p className="compare-lede">
            Pick up to {MAX_COMPARE} listings. The rows adapt to what they have in common — sector
            specifics only appear when every listing selected actually has them.
          </p>
        </header>

        <ComparePicker
          options={options.map((o) => ({
            slug: o.slug,
            name: o.name,
            sector: o.industry.parent ? `${o.industry.parent.name} · ${o.industry.name}` : o.industry.name,
          }))}
          selected={companies.map((c) => ({ slug: c.slug, name: c.name }))}
        />

        {missing.length > 0 && (
          <p className="form-msg err">
            Not found or not public: {missing.join(", ")}.
          </p>
        )}

        {companies.length < 2 ? (
          <p className="admin-empty">
            Choose at least two listings to compare.{" "}
            <Link href="/directory">Browse the directory</Link> if you&apos;re not sure where to
            start.
          </p>
        ) : (
          <>
            {note && <p className="compare-note">{note}</p>}
            <CompareTable companies={companies.map((c) => ({ slug: c.slug, name: c.name, logoInitials: c.logoInitials, logoColor: c.logoColor }))} rows={rows} />
          </>
        )}
      </div>
    </main>
  );
}
