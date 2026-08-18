import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SIGNAL_DEFINITIONS, loadWeights } from "@/lib/activitySignals";
import AdminWeights from "@/components/admin/AdminWeights";

export default async function WeightsPage() {
  const [weights, totalCompanies, withChecks, withHashes, withReviews, withRounds, withVerified] =
    await Promise.all([
      loadWeights(),
      prisma.company.count({ where: { status: "active" } }),
      prisma.company.count({ where: { status: "active", websiteChecks: { some: {} } } }),
      prisma.company.count({
        where: { status: "active", websiteChecks: { some: { contentHash: { not: null } } } },
      }),
      prisma.company.count({
        where: { status: "active", reviews: { some: { status: "published" } } },
      }),
      prisma.company.count({ where: { status: "active", fundingRounds: { some: {} } } }),
      prisma.company.count({ where: { status: "active", lastVerifiedAt: { not: null } } }),
    ]);

  return (
    <>
      <div className="admin-panel-head admin-page-head">
        <div>
          <h2>Activity score weights</h2>
          <p className="admin-lede">
            What the activity score is made of, and how much each part counts.
          </p>
        </div>
        <Link className="btn btn-ghost" href="/admin/activity">
          ← Back to activity
        </Link>
      </div>

      <AdminWeights
        definitions={SIGNAL_DEFINITIONS}
        current={weights}
        totalCompanies={totalCompanies}
        coverageCounts={{
          website: withChecks,
          website_content: withHashes,
          customer_activity: withReviews,
          funding_activity: withRounds,
          data_freshness: withVerified,
        }}
      />
    </>
  );
}
