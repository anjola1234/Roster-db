import Link from "next/link";
import { getAdminCompanies } from "@/lib/adminQueries";
import AdminCompanyTable from "@/components/admin/AdminCompanyTable";
import AdminCompanyFilters from "@/components/admin/AdminCompanyFilters";

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; verification?: string; q?: string }>;
}) {
  const { status, verification, q } = await searchParams;
  const companies = await getAdminCompanies({ status, verification, q });

  return (
    <>
      <div className="admin-panel-head admin-page-head">
        <div>
          <h2>Companies</h2>
          <p className="admin-lede">
            {companies.length} listing{companies.length === 1 ? "" : "s"} shown
            {companies.length === 200 ? " (first 200 — narrow the filters to see more)" : ""}.
          </p>
        </div>
        <div className="admin-actions-row">
          <Link className="btn btn-secondary" href="/admin/companies/import">
            Bulk import
          </Link>
          <Link className="btn btn-primary" href="/admin/companies/new">
            Add company
          </Link>
        </div>
      </div>

      <AdminCompanyFilters status={status} verification={verification} q={q} />
      <AdminCompanyTable companies={companies} />
    </>
  );
}
