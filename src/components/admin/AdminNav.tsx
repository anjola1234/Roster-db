"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Counts = { submissions: number; reviews: number; claims: number };

const LINKS = [
  { href: "/admin", label: "Overview", key: null },
  { href: "/admin/companies", label: "Companies", key: null },
  { href: "/admin/submissions", label: "Submissions", key: "submissions" },
  { href: "/admin/claims", label: "Claims", key: "claims" },
  { href: "/admin/reviews", label: "Reviews", key: "reviews" },
] as const;

export default function AdminNav({ counts }: { counts: Counts }) {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin sections">
      {LINKS.map((link) => {
        // "/admin" would otherwise match every sub-route.
        const active =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        const count = link.key ? counts[link.key] : 0;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`admin-tab${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
            {count > 0 && (
              <span className="admin-tab-count" aria-label={`${count} awaiting review`}>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
