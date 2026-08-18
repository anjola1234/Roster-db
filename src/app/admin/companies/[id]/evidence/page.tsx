import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { evidenceFields } from "@/lib/evidence";
import AdminEvidence from "@/components/admin/AdminEvidence";

export default async function EvidencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [company, rows, sources] = await Promise.all([
    prisma.company.findUnique({ where: { id }, select: { id: true, name: true, slug: true } }),
    prisma.fieldProvenance.findMany({
      where: { companyId: id },
      include: {
        source: { select: { key: true, name: true, kind: true, trustRank: true } },
        verifiedBy: { select: { email: true } },
      },
      // Authoritative first, then most trusted source, then most recent.
      orderBy: [{ isWinning: "desc" }, { fetchedAt: "desc" }],
    }),
    prisma.dataSource.findMany({
      select: { key: true, name: true, kind: true },
      orderBy: { trustRank: "asc" },
    }),
  ]);

  if (!company) notFound();

  return (
    <>
      <div className="admin-actions-row" style={{ marginBottom: "var(--s-4)" }}>
        <Link className="btn btn-ghost" href={`/admin/companies/${company.id}`}>
          ← Back to listing
        </Link>
        <Link className="btn btn-ghost" href={`/company/${company.slug}`}>
          View public page ↗
        </Link>
        <Link className="btn btn-ghost" href={`/admin/audit?entity=${company.id}`}>
          Audit history
        </Link>
      </div>

      <AdminEvidence
        companyId={company.id}
        companyName={company.name}
        rows={rows}
        sources={sources}
        fields={evidenceFields()}
      />
    </>
  );
}
