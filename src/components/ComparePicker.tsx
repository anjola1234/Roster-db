"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MAX_COMPARE } from "@/lib/compare";

type Option = { slug: string; name: string; sector: string };

export default function ComparePicker({
  options,
  selected,
}: {
  options: Option[];
  selected: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const chosen = selected.map((s) => s.slug);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return options
      .filter((o) => !chosen.includes(o.slug))
      .filter((o) => o.name.toLowerCase().includes(q) || o.sector.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, options, chosen]);

  // Selection lives entirely in the URL, so a comparison is a link someone can
  // send. No local state to get out of sync with what's on screen.
  function go(slugs: string[]) {
    router.push(slugs.length ? `/compare?c=${slugs.join(",")}` : "/compare");
  }

  function add(slug: string) {
    if (chosen.length >= MAX_COMPARE) return;
    setQuery("");
    go([...chosen, slug]);
  }

  const full = chosen.length >= MAX_COMPARE;

  return (
    <div className="compare-picker">
      <div className="compare-chips">
        {selected.map((s) => (
          <span key={s.slug} className="compare-chip">
            {s.name}
            <button
              type="button"
              aria-label={`Remove ${s.name} from the comparison`}
              onClick={() => go(chosen.filter((c) => c !== s.slug))}
            >
              ×
            </button>
          </span>
        ))}
        {selected.length > 0 && (
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => go([])}>
            Clear all
          </button>
        )}
      </div>

      <div className="compare-search">
        <input
          className="control"
          type="search"
          value={query}
          disabled={full}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            full
              ? `Maximum of ${MAX_COMPARE} — remove one to add another`
              : "Search for a company to add…"
          }
          aria-label="Search for a company to compare"
        />
        {matches.length > 0 && (
          <ul className="compare-results">
            {matches.map((m) => (
              <li key={m.slug}>
                <button type="button" onClick={() => add(m.slug)}>
                  <span className="compare-result-name">{m.name}</span>
                  <span className="compare-result-sector">{m.sector}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim() && matches.length === 0 && (
          <p className="compare-empty">No public listings match &ldquo;{query.trim()}&rdquo;.</p>
        )}
      </div>
    </div>
  );
}
