import Link from "next/link";
import { getReviewQueue } from "@/lib/adminQueries";
import AdminReviews from "@/components/admin/AdminReviews";

const TABS = ["pending", "published", "rejected", "removed"] as const;

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: raw } = await searchParams;
  const status = (TABS as readonly string[]).includes(raw ?? "") ? raw! : "pending";
  const reviews = await getReviewQueue(status);

  return (
    <>
      <div className="admin-panel-head admin-page-head">
        <div>
          <h2>Reviews</h2>
          <p className="admin-lede">
            Reviews are held as pending on submission and only appear publicly once published.
            Publishing or unpublishing recalculates the company&apos;s rating.
          </p>
        </div>
      </div>

      <div className="admin-filters">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/reviews?status=${t}`}
            className={`btn ${t === status ? "btn-secondary" : "btn-ghost"}`}
          >
            {t}
          </Link>
        ))}
      </div>

      <AdminReviews reviews={reviews} status={status} />
    </>
  );
}
