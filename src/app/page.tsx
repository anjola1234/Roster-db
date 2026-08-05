import Link from "next/link";
import Hero from "@/components/Hero";
import EcosystemStats from "@/components/EcosystemStats";
import DirectoryPreview from "@/components/DirectoryPreview";
import WhatPlatformDoes from "@/components/WhatPlatformDoes";
import SignupCTA from "@/components/SignupCTA";
import ReviewDeck from "@/components/ReviewDeck";
import {
  getEcosystemStats,
  getHeroFragments,
  getIndustries,
  getRegions,
  getReviewDeck,
} from "@/lib/queries";

export default async function Home() {
  const [stats, fragments, industries, regions, reviews] = await Promise.all([
    getEcosystemStats(),
    getHeroFragments(40),
    getIndustries(),
    getRegions(),
    getReviewDeck(),
  ]);

  const reviewRows = reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    authorRole: r.authorRole,
    rating: r.rating,
    title: r.title,
    body: r.body,
    company: {
      name: r.company.name,
      slug: r.company.slug,
      logoInitials: r.company.logoInitials,
      logoColor: r.company.logoColor,
    },
  }));

  return (
    <main>
      <Hero fragments={fragments} investorCount={stats.investors} stateCount={stats.regions} />

      {/* ---- 4. Ecosystem statistics ---- */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">§ 01 / The ecosystem in numbers</span>
            <h2>One stop place to every company.</h2>
            <p>Real counts pulled straight from the directory database — nothing here is hardcoded.</p>
          </div>
          <EcosystemStats stats={stats} />
        </div>
      </section>

      {/* ---- 5. Explore Directory preview ---- */}
      <section className="section alt">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">§ 02 / Preview</span>
            <h2>Explore the ecosystem.</h2>
            <p>A quick look across industries. The full directory has category-adaptive columns, tag filters and sorting.</p>
          </div>
          <DirectoryPreview industries={industries} regions={regions} />
        </div>
      </section>

      {/* ---- 6. Sign-up / conversion ---- */}
      <section className="section">
        <div className="wrap">
          <SignupCTA />
        </div>
      </section>

      {/* ---- 7. What the platform does ---- */}
      <section className="section alt" id="platform">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">§ 03 / What you can do here</span>
            <h2>What you can do on the platform.</h2>
          </div>
          <WhatPlatformDoes stats={stats} topMatches={fragments.slice(0, 3)} />
        </div>
      </section>

      {/* ---- 8. Reviews ---- */}
      <section className="section" id="reviews">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">§ 04 / From the ecosystem</span>
            <h2>Real experiences from the ecosystem.</h2>
            <p>Real reviews from customers, patients and operators across the directory.</p>
          </div>
          <ReviewDeck reviews={reviewRows} />
          <div className="review-cta">
            <Link className="btn btn-secondary" href="/directory">
              Have an experience to share? Leave a Review →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
