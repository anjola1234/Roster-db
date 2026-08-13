import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin";
import { getQueueCounts } from "@/lib/adminQueries";
import AdminNav from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Admin — IndexOne",
  // Belt-and-braces alongside the auth guard: nothing under /admin should
  // ever end up in a search index.
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Runs on every admin page render. Redirects before any child component
  // touches the database.
  const user = await requireAdminPage();
  const counts = await getQueueCounts();

  return (
    <main className="admin-shell">
      <div className="wrap">
        <div className="admin-head">
          <div>
            <span className="eyebrow">Admin</span>
            <h1>Directory operations</h1>
          </div>
          <span className="admin-whoami mono">
            {user.name} · {user.email}
          </span>
        </div>

        <AdminNav
          counts={{
            submissions: counts.pendingCompanies,
            reviews: counts.pendingReviews,
            claims: counts.pendingClaims,
          }}
        />

        {children}
      </div>
    </main>
  );
}
