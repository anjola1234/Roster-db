import Link from "next/link";

const BENEFITS = [
  "Save companies and products to your own shortlist",
  "Follow industries and get a feel for what's moving",
  "Leave reviews on companies you've actually used",
  "Build a personalized directory around what you care about",
  "Track ecosystem activity as new listings verify",
];

export default function SignupCTA() {
  return (
    <div className="cta-panel">
      <div>
        <span className="eyebrow">Join the directory</span>
        <h2>Your own view of the ecosystem, not just a static list.</h2>
        <ul className="cta-benefits">
          {BENEFITS.map((b) => (
            <li key={b}>
              <span className="tick">✔</span> {b}
            </li>
          ))}
        </ul>
        <div className="cta-actions">
          <Link className="btn btn-primary" href="/signup">
            Create an Account
          </Link>
          <Link className="btn btn-secondary" href="/directory">
            Start Exploring
          </Link>
        </div>
      </div>
      <div className="panel" style={{ background: "var(--surface)" }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          Why it&rsquo;s worth an account
        </p>
        <p style={{ color: "var(--ink-soft)", fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          IndexOne is built to grow with the ecosystem it tracks. An account turns a static directory into a living
          one — the companies and industries you follow, the products you&rsquo;ve reviewed, and what&rsquo;s changed
          since your last visit, all in one place.
        </p>
      </div>
    </div>
  );
}
