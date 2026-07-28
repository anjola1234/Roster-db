"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  user: { id: string; email: string; name: string } | null;
};

export default function NavBar({ user }: Props) {
  const router = useRouter();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/directory?q=${encodeURIComponent(query)}` : "/directory");
  }

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <Link className="brand" href="/">
            <span className="brand-mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
              </svg>
            </span>
            IndexOne
          </Link>

          <form className="nav-search-form" onSubmit={submitSearch} role="search">
            <span aria-hidden="true" style={{ color: "var(--muted)" }}>
              ⌕
            </span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Try "Reddington", "payments", or "maternity"…'
              aria-label="Search the directory"
            />
          </form>
          <button
            className="nav-search-icon-btn"
            aria-label="Open search"
            onClick={() => setMobileSearchOpen((v) => !v)}
            type="button"
          >
            ⌕
          </button>

          <div className="topbar-right">
            <Link className="nav-link topbar-nav" href="/directory">
              Explore Directory
            </Link>
            {user ? (
              <form action="/api/logout" method="post">
                <button className="btn btn-ghost" type="submit">
                  Log out
                </button>
              </form>
            ) : (
              <Link className="btn btn-ghost" href="/signup">
                Sign Up
              </Link>
            )}
            <Link className="btn btn-primary" href="/list-your-product">
              <span className="long">List Your Product</span>
            </Link>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="wrap" style={{ paddingBottom: 12 }}>
            <form onSubmit={submitSearch} role="search" style={{ display: "flex", gap: 8 }}>
              <input
                className="control"
                style={{ flex: 1 }}
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search the directory…"
                aria-label="Search the directory"
                autoFocus
              />
              <button className="btn btn-primary" type="submit">
                Go
              </button>
            </form>
          </div>
        )}
      </header>

      <div className="release-strip">
        <div className="wrap">
          <span className="release-status">
            <span className="dot" /> Release v2026.05 · Pilot region: Nigeria
          </span>
        </div>
      </div>
    </>
  );
}
