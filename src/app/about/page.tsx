import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — IndexOne",
  description:
    "What IndexOne is, how listings get verified, and how the website activity signal is calculated.",
};

export default function AboutPage() {
  return (
    <main className="about-page">
      <div className="wrap">
        <header className="about-head">
          <span className="eyebrow">About</span>
          <h1>A directory that says what it actually knows</h1>
          <p className="about-lede">
            IndexOne catalogues companies and institutions across Africa — starting with Nigeria —
            and tries to be honest about the difference between a fact we&apos;ve confirmed and one
            we haven&apos;t.
          </p>
        </header>

        <section className="panel about-section">
          <h2>What&apos;s in the directory</h2>
          <p>
            Listings span fintech, healthcare, engineering and construction, legal, education, and
            science and research, across Nigeria, Ghana, Kenya, South Africa, Rwanda and Egypt. You
            can browse by <Link href="/directory">sector, region or feature</Link>, and every filter
            combination has its own shareable URL.
          </p>
          <p>
            Anyone can <Link href="/list-your-product">submit a company</Link>. Submissions are not
            published automatically — they sit in a review queue until a human approves them.
          </p>
        </section>

        <section className="panel about-section" id="methodology">
          <h2>How verification works</h2>
          <p>
            A listing carries one of three states, and they mean specific things:
          </p>
          <ul className="about-list">
            <li>
              <strong>Unverified</strong> — the listing exists and the details look plausible, but
              nobody has confirmed them against a primary source. Most listings start here, and
              staying here is not a mark against a company.
            </li>
            <li>
              <strong>Verified</strong> — a person checked the listing against something
              authoritative, or someone who represents the company claimed it and proved the
              connection.
            </li>
            <li>
              <strong>Flagged</strong> — something looks wrong and it needs another look.
            </li>
          </ul>
          <p>
            Company representatives can claim their listing from its page. A claim is an assertion,
            not proof: it goes to a review queue, and the badge is only issued once someone confirms
            it independently.
          </p>

          <h3>The website activity signal</h3>
          <p>
            Each listing shows an activity score derived from real HTTP requests to the company&apos;s
            website — not an estimate, and not a placeholder. The checker records whether the site
            responded, its HTTP status, response time, and whether the page looks like a parked
            domain, then scores the recent history:
          </p>
          <ul className="about-list">
            <li>What fraction of recent checks reached a live site</li>
            <li>How recently the most recent successful check happened</li>
            <li>
              A cap: if the latest check failed, or the last three in a row failed, the score is
              held down regardless of good history
            </li>
          </ul>
          <p>
            A company that has never been checked shows <strong>no score at all</strong> rather than
            a made-up one. Social media presence is <em>not</em> monitored — there&apos;s no API
            access for it, so nothing is inferred.
          </p>
          <p className="about-caveat">
            The scoring formula is a starting point, not a measure of business health. A working
            website means the website works. It doesn&apos;t mean the company is doing well, and a
            broken one doesn&apos;t mean it&apos;s gone.
          </p>
        </section>

        <section className="panel about-section">
          <h2>Where the data comes from</h2>
          <p>
            Every listing records a source. Some were entered by hand from public company websites
            and regulator registries; some came through public submissions; some were bulk-imported.
            Figures we couldn&apos;t confirm — funding, valuation, headcount — are left blank rather
            than estimated, and ratings are only shown when there are real published reviews behind
            them.
          </p>
          <p>
            If something here is wrong about your organisation, claim the listing from its page or
            get in touch and we&apos;ll correct it.
          </p>
        </section>

        <section className="panel about-section" id="contact">
          <h2>Contact</h2>
          <p>
            For corrections, takedowns, data questions or partnership enquiries, email{" "}
            <a href="mailto:hello@indexone.example">hello@indexone.example</a>.
          </p>
          <p className="about-caveat">
            Replace this address with a real inbox before launch — it&apos;s a placeholder, and it
            is the only one left in the app.
          </p>
        </section>
      </div>
    </main>
  );
}
