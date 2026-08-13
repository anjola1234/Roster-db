import Link from "next/link";
import { getFormOptions } from "@/lib/adminQueries";
import AdminCompanyForm from "@/components/admin/AdminCompanyForm";

export default async function NewCompanyPage() {
  const options = await getFormOptions();

  return (
    <>
      <div className="admin-panel-head admin-page-head">
        <div>
          <h2>Add a company</h2>
          <p className="admin-lede">
            Starts as a draft. Set the status to <strong>active</strong> below when it&apos;s ready
            to appear in the public directory.
          </p>
        </div>
        <Link className="btn btn-ghost" href="/admin/companies">
          ← Back to companies
        </Link>
      </div>

      <AdminCompanyForm options={options} />
    </>
  );
}
