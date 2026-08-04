"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ActivityBadge from "@/components/ActivityBadge";
import SectorIcon, { kindForCategory } from "@/components/SectorIcon";

type Industry = { id: string; slug: string; name: string; children: { id: string; slug: string; name: string }[] };
type Region = { id: string; slug: string; name: string };

type PreviewRow = {
  slug: string;
  name: string;
  logoInitials: string;
  logoColor: string;
  verification: string;
  shortDescription: string;
  lifecycleStatus: string;
  activityScore: number | null;
  activityLabel: string | null;
  industry: { name: string; parent: { name: string; slug: string } | null };
  regions: { isPrimary: boolean; region: { name: string } }[];
};

// A single tab in the sector rail. `vertical`/`sub` are the filter values it
// applies; `sub` is null for a top-level vertical (or the "all" tab).
type RailTab = {
  id: string;
  label: string;
  vertical: string;
  sub: string | null;
};

function verifyPill(v: string) {
  if (v === "verified") return <span className="pill emerald">● Verified</span>;
  if (v === "flagged") return <span className="pill amber">⚑ Flagged</span>;
  return <span className="pill">○ Unverified</span>;
}

export default function DirectoryPreview({ industries, regions }: { industries: Industry[]; regions: Region[] }) {
  const [vertical, setVertical] = useState("all");
  const [subVertical, setSubVertical] = useState("all");
  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Build the sector rail from REAL industry data -----------------------
  // "All Sectors" + every top-level vertical + every sub-vertical, flattened
  // into one horizontal row of tabs. Nothing here is invented — it mirrors what
  // is actually in the directory, so the rail grows automatically as verticals
  // are added.
  const railTabs = useMemo<RailTab[]>(() => {
    const tabs: RailTab[] = [{ id: "all", label: "All Sectors", vertical: "all", sub: null }];
    for (const v of industries) {
      tabs.push({ id: `v:${v.slug}`, label: v.name, vertical: v.slug, sub: null });
      for (const c of v.children) {
        tabs.push({ id: `s:${c.slug}`, label: c.name, vertical: v.slug, sub: c.slug });
      }
    }
    return tabs;
  }, [industries]);

  const activeTabId = useMemo(() => {
    if (vertical === "all") return "all";
    if (subVertical !== "all") return `s:${subVertical}`;
    return `v:${vertical}`;
  }, [vertical, subVertical]);

  function selectTab(tab: RailTab) {
    setVertical(tab.vertical);
    setSubVertical(tab.sub ?? "all");
  }

  // ---- Rail scroll behaviour ----------------------------------------------
  // Vertical wheel/trackpad gestures translate to horizontal scroll so the rail
  // is usable with a mouse; touch/native horizontal scroll is untouched. Edge
  // fades are toggled by class so they only show when content overflows.
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  function updateEdges() {
    const el = railRef.current;
    if (!el) return;
    const start = el.scrollLeft > 4;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }

  useEffect(() => {
    updateEdges();
    const onResize = () => updateEdges();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [railTabs]);

  function onRailWheel(e: React.WheelEvent<HTMLDivElement>) {
    const el = railRef.current;
    if (!el) return;
    // Only hijack predominantly-vertical gestures; leave real horizontal
    // trackpad swipes to scroll natively.
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  }

  // Keep the active tab in view when it changes (e.g. picking a deep sub-vertical).
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeTabId]);

  // ---- Data fetch (unchanged contract with /api/companies) -----------------
  useEffect(() => {
    const params = new URLSearchParams();
    if (subVertical !== "all") params.set("industry", subVertical);
    else if (vertical !== "all") params.set("vertical", vertical);
    if (region !== "all") params.set("region", region);
    if (status !== "all") params.set("status", status);
    params.set("limit", "10");

    // Standard fetch-in-effect loading pattern: setLoading(true) fires
    // synchronously so the UI shows a loading state immediately.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/companies?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setRows(data.companies ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [vertical, subVertical, region, status]);

  const secondaryActive = region !== "all" || status !== "all";

  return (
    <div>
      {/* -- Sector rail: the primary "browse by sector" control ------------- */}
      <div className={`category-rail ${edges.start ? "fade-start" : ""} ${edges.end ? "fade-end" : ""}`}>
        <div
          ref={railRef}
          className="category-track"
          role="tablist"
          aria-label="Browse by sector"
          onWheel={onRailWheel}
          onScroll={updateEdges}
        >
          {railTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-active={isActive}
                className={`sector-chip ${isActive ? "is-active" : ""} ${tab.sub ? "is-sub" : ""}`}
                onClick={() => selectTab(tab)}
              >
                <SectorIcon kind={kindForCategory(tab.label)} />
                <span className="sector-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* -- Secondary filters: deliberately lightweight -------------------- */}
      <div className="dir-filters">
        <div className="filter-group">
          <span className="filter-label">Region</span>
          <select className="control" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="all">All regions</option>
            {regions.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">Status</span>
          <select className="control" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="verified">Verified only</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
        {secondaryActive && (
          <button
            type="button"
            className="filter-clear"
            onClick={() => {
              setRegion("all");
              setStatus("all");
            }}
          >
            Clear filters
          </button>
        )}
        <span className="filter-count" aria-live="polite">
          {loading ? "Loading…" : `Top ${rows?.length ?? 0} across the ecosystem`}
        </span>
      </div>

      <div className="table-wrap">
        <table className="dir">
          <thead>
            <tr>
              <th>Entity</th>
              <th>Category</th>
              <th>Description</th>
              <th>Region</th>
              <th>Status</th>
              <th>Activity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((l) => {
              const primary = l.regions.find((r) => r.isPrimary) ?? l.regions[0];
              const extra = l.regions.length - 1;
              return (
                <tr key={l.slug}>
                  <td>
                    <div className="ent">
                      <div className="ent-logo" style={{ background: l.logoColor }}>
                        {l.logoInitials}
                      </div>
                      <div>
                        <div className="ent-name">
                          {l.name} {l.verification === "verified" && <span className="verified-badge">✔</span>}
                        </div>
                        <div className="ent-sub">
                          {l.industry.parent?.name ?? l.industry.name} · {l.industry.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="pill indigo">{l.industry.parent?.name ?? l.industry.name}</span>
                  </td>
                  <td className="td-desc">{l.shortDescription}</td>
                  <td>
                    <span className="geo-chip">
                      <span className="cc">NG</span> {primary?.region.name ?? "—"}
                      {extra > 0 && <span className="plus-more">+{extra}</span>}
                    </span>
                  </td>
                  <td>{verifyPill(l.verification)}</td>
                  <td>
                    <ActivityBadge company={l} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link className="explore-link" href={`/company/${l.slug}`}>
                      Explore deeper →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!loading && rows && rows.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty">
                    <div className="ico">◍</div>
                    <h3>No listings match those filters</h3>
                    <p>Try another sector, or clear the region and status filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="see-all">
        <Link className="btn btn-secondary" href="/directory">
          See all companies in the full directory →
        </Link>
      </div>
    </div>
  );
}
