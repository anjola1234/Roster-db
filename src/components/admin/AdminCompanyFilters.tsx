"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LISTING_STATUSES, VERIFICATION_STATUSES } from "@/lib/validation";

type Props = { status?: string; verification?: string; q?: string };

export default function AdminCompanyFilters({ status, verification, q }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(q ?? "");

  // Filters live in the URL so a filtered view is shareable and survives the
  // router.refresh() that every moderation action triggers.
  function apply(next: Partial<Props>) {
    const params = new URLSearchParams();
    const merged = { status, verification, q: search, ...next };
    if (merged.status) params.set("status", merged.status);
    if (merged.verification) params.set("verification", merged.verification);
    if (merged.q) params.set("q", merged.q);
    const qs = params.toString();
    router.push(qs ? `/admin/companies?${qs}` : "/admin/companies");
  }

  return (
    <form
      className="admin-filters"
      onSubmit={(e) => {
        e.preventDefault();
        apply({});
      }}
    >
      <input
        className="control"
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, slug, or submitter email…"
        aria-label="Search listings"
      />
      <select
        className="control"
        value={status ?? ""}
        onChange={(e) => apply({ status: e.target.value })}
        aria-label="Filter by listing status"
      >
        <option value="">Any status</option>
        {LISTING_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        className="control"
        value={verification ?? ""}
        onChange={(e) => apply({ verification: e.target.value })}
        aria-label="Filter by verification"
      >
        <option value="">Any verification</option>
        {VERIFICATION_STATUSES.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      <button className="btn btn-secondary" type="submit">
        Search
      </button>
      {(status || verification || q) && (
        <button className="btn btn-ghost" type="button" onClick={() => router.push("/admin/companies")}>
          Clear
        </button>
      )}
    </form>
  );
}
