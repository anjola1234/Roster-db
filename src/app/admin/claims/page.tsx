import { getClaimQueue } from "@/lib/adminQueries";
import AdminClaims from "@/components/admin/AdminClaims";

export default async function ClaimsPage() {
  const claims = await getClaimQueue();

  return (
    <>
      <div className="admin-panel-head admin-page-head">
        <div>
          <h2>Ownership claims</h2>
          <p className="admin-lede">
            People asserting they represent a listed company. Approving records a verification badge
            against the listing and marks it verified.
          </p>
        </div>
      </div>

      <AdminClaims claims={claims} />
    </>
  );
}
