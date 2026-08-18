import Link from "next/link";
import NewsletterForm from "@/components/NewsletterForm";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-pitch">
            <Link className="brand" href="/">
              <span className="brand-mark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
                </svg>
              </span>
              IndexOne
            </Link>
            <p>The directory for discovering the companies, products, and institutions shaping the next wave.</p>
            <NewsletterForm />
            {/* Social icons were three href="#" stubs. IndexOne has no
                published accounts yet, so rather than render dead links,
                nothing is shown until there's somewhere real to point.
                Add them back here when the accounts exist. */}
          </div>

          <div className="footer-col">
            <h4>Discover</h4>
            <ul>
              <li>
                <Link href="/directory">Explore Directory</Link>
              </li>
              <li>
                <Link href="/directory?status=verified">Verified companies</Link>
              </li>
              <li>
                <Link href="/directory?vertical=fintech">Fintech</Link>
              </li>
              <li>
                <Link href="/directory?vertical=healthcare">Healthcare</Link>
              </li>
              <li>
                <Link href="/directory?vertical=engineering">Engineering</Link>
              </li>
              <li>
                <Link href="/directory?vertical=legal">Legal</Link>
              </li>
              <li>
                <Link href="/directory?vertical=education">Education</Link>
              </li>
              <li>
                <Link href="/directory?vertical=science">Science &amp; Research</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/about#methodology">How we verify</Link>
              </li>
              <li>
                <Link href="/list-your-product">List Your Product</Link>
              </li>
              <li>
                <Link href="/compare">Compare companies</Link>
              </li>
              <li>
                <Link href="/directory?region=ng">Browse Nigeria</Link>
              </li>
              <li>
                <Link href="/about#contact">Contact</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} IndexOne. Pilot region: Nigeria.</span>
          <span>Release v2026.05</span>
        </div>
      </div>
    </footer>
  );
}
