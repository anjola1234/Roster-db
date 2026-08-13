import { getPendingSubmissions } from "@/lib/adminQueries";
import AdminSubmissions from "@/components/admin/AdminSubmissions";

export default async function SubmissionsPage() {
  const submissions = await getPendingSubmissions();

  return (
    <>
      <div className="admin-panel-head admin-page-head">
        <div>
          <h2>Submissions</h2>
          <p className="admin-lede">
            Listings the public submitted. They stay invisible on the site until approved. Oldest
            first.
          </p>
        </div>
      </div>

      <AdminSubmissions submissions={submissions} />
    </>
  );
}
