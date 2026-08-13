import Link from "next/link";
import { getFormOptions } from "@/lib/adminQueries";
import AdminImport from "@/components/admin/AdminImport";

export default async function ImportPage() {
  const { verticals, regions } = await getFormOptions();

  return (
    <>
      <div className="admin-panel-head admin-page-head">
        <div>
          <h2>Bulk import companies</h2>
          <p className="admin-lede">Upload a CSV to create many listings at once.</p>
        </div>
        <Link className="btn btn-ghost" href="/admin/companies">
          ← Back to companies
        </Link>
      </div>

      <AdminImport />

      <section className="panel">
        <h3 className="admin-section-title">Valid slugs</h3>
        <p className="admin-lede">
          The <code>industrySlug</code> and <code>regionSlug</code> columns must match one of these
          exactly.
        </p>
        <div className="admin-grid-2">
          <div>
            <p className="eyebrow">Industry slugs</p>
            <ul className="admin-slug-list">
              {verticals.flatMap((v) =>
                v.children.map((c) => (
                  <li key={c.slug}>
                    <code>{c.slug}</code> <span className="admin-muted">{v.name} · {c.name}</span>
                  </li>
                )),
              )}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Region slugs</p>
            <ul className="admin-slug-list">
              {regions.map((r) => (
                <li key={r.slug}>
                  <code>{r.slug}</code> <span className="admin-muted">{r.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
