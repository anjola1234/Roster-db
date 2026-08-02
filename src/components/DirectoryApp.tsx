"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { money } from "@/lib/format";
import ActivityBadge from "@/components/ActivityBadge";

type Industry = { id: string; slug: string; name: string; icon: string | null; accent: string | null; children: { id: string; slug: string; name: string }[] };
type Region = { id: string; slug: string; name: string };
type Feature = { id: string; slug: string; name: string; group: string; industry: { slug: string } };

type CompanyRow = {
  slug: string;
  name: string;
  logoInitials: string;
  logoColor: string;
  shortDescription: string;
  verification: string;
  website: string;
  socials: Record<string, string> | null;
  lifecycleStatus: string;
  activityScore: number | null;
  activityLabel: string | null;
  totalFunding: number | null;
  bedCapacity: number | null;
  foundingYear: number | null;
  yearEstablished: number | null;
  city: string | null;
  facilityBody: string | null;
  facilityNo: string | null;
  industry: { name: string; slug: string; parent: { name: string; slug: string } | null };
  regions: { isPrimary: boolean; region: { name: string } }[];
  tags: { slug: string; name: string }[];
  investors: { investor: { name: string } }[];
};

const VERTICAL_META: Record<string, { icon: string; label: string }> = {
  fintech: { icon: "▲", label: "Fintech" },
  healthcare: { icon: "✚", label: "Hospitals" },
};

function verifyPill(v: string) {
  if (v === "verified") return <span className="pill emerald">● Verified</span>;
  if (v === "flagged") return <span className="pill amber">⚑ Flagged</span>;
  return <span className="pill">○ Unverified</span>;
}

function socialIcons(s: Record<string, string> | null) {
  const map: Record<string, string> = { x: "𝕏", linkedin: "in", instagram: "IG", facebook: "f" };
  const keys = Object.keys(s || {});
  if (!keys.length) return <span className="mono" style={{ color: "var(--faint)" }}>—</span>;
  return (
    <span className="socials">
      {keys.map((k) => (
        <a key={k} href={s![k]} title={k} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
          {map[k] || k}
        </a>
      ))}
    </span>
  );
}

export default function DirectoryApp({
  industries,
  regions,
  features,
}: {
  industries: Industry[];
  regions: Region[];
  features: Feature[];
}) {
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<string>("all");
  const [region, setRegion] = useState("all");
  const [subcat, setSubcat] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("az");
  const [tags, setTags] = useState<string[]>([]);
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ all: 0 });
  const [loading, setLoading] = useState(true);

  // Load unfiltered counts once for the category tabs.
  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data: { companies: CompanyRow[] }) => {
        const all = data.companies.length;
        const byVertical: Record<string, number> = { all };
        for (const c of data.companies) {
          const v = c.industry.parent?.slug ?? c.industry.slug;
          byVertical[v] = (byVertical[v] ?? 0) + 1;
        }
        setCounts(byVertical);
      })
      .catch(() => {});
  }, []);

  // Category change also resets the dependent sub-vertical + tag filters.
  // Done inside the event handler (not an effect) so it's a single render.
  function selectCategory(next: string) {
    setCategory(next);
    setSubcat("all");
    setTags([]);
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (subcat !== "all") params.set("industry", subcat);
    else if (category !== "all") params.set("vertical", category);
    if (region !== "all") params.set("region", region);
    if (status !== "all") params.set("status", status);
    if (tags.length) params.set("tags", tags.join(","));
    if (q) params.set("q", q);
    if (sort !== "az") params.set("sort", sort);

    // Standard fetch-in-effect loading pattern: setLoading(true) fires
    // synchronously so the UI shows a loading state immediately, before the
    // async request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/companies?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { companies: CompanyRow[] }) => setRows(data.companies))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [category, subcat, region, status, tags, q, sort]);

  const activeIndustry = useMemo(() => industries.find((i) => i.slug === category), [industries, category]);
  const activeFeatures = useMemo(() => features.filter((f) => f.industry.slug === category), [features, category]);

  const sorts = activeIndustry
    ? category === "healthcare"
      ? [
          ["az", "A - Z"],
          ["beds", "Most beds"],
          ["newest", "Newest"],
        ]
      : [
          ["az", "A - Z"],
          ["funding", "Most funded"],
          ["newest", "Newest"],
        ]
    : [
        ["az", "A - Z"],
        ["newest", "Newest"],
      ];

  function clearFilters() {
    setRegion("all");
    setSubcat("all");
    setStatus("all");
    setTags([]);
    setQ("");
  }

  function toggleTag(slug: string) {
    setTags((prev) => (prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]));
  }

  const columns = columnDefsFor(category);

  return (
    <div className="wrap" style={{ paddingTop: "var(--s-10)", paddingBottom: "var(--s-20)" }}>
      <div className="section-head left">
        <span className="eyebrow">§ 01 / Explore the directory</span>
        <h2>Browse verified entities</h2>
      </div>

      <div className="cat-tabs">
        <button className={`cat-tab ${category === "all" ? "active" : ""}`} onClick={() => selectCategory("all")}>
          <span className="ico">◆</span> All <span className="count">{counts.all ?? 0}</span>
        </button>
        {industries.map((i) => (
          <button key={i.slug} className={`cat-tab ${category === i.slug ? "active" : ""}`} onClick={() => selectCategory(i.slug)}>
            <span className="ico">{VERTICAL_META[i.slug]?.icon ?? i.icon}</span> {VERTICAL_META[i.slug]?.label ?? i.name}{" "}
            <span className="count">{counts[i.slug] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <div className="filter-row">
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
            <span className="filter-label">{category === "healthcare" ? "Type" : "Sub-vertical"}</span>
            <select className="control" value={subcat} onChange={(e) => setSubcat(e.target.value)} disabled={!activeIndustry}>
              <option value="all">{activeIndustry ? `All ${activeIndustry.name.toLowerCase()}` : "Pick a category first"}</option>
              {activeIndustry?.children.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
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
          <div className="filter-group">
            <span className="filter-label">Sort</span>
            <select className="control" value={sort} onChange={(e) => setSort(e.target.value)}>
              {sorts.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group" style={{ flex: 1 }}>
            <input
              className="control"
              style={{ width: "100%" }}
              placeholder="Search companies…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="clear-btn" onClick={clearFilters}>
            Clear all
          </button>
        </div>
        {activeIndustry && (
          <div className="filter-row">
            <span className="filter-label">Features</span>
            <div className="feat-chips">
              {activeFeatures.map((t) => (
                <button key={t.slug} className={`chip-toggle ${tags.includes(t.slug) ? "on" : ""}`} onClick={() => toggleTag(t.slug)}>
                  <span className="grp">{t.group}</span>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="result-meta">
        <span className="result-count">
          {loading ? "Loading…" : `Showing ${rows.length} ${activeIndustry ? "· " + activeIndustry.name : ""}${tags.length ? ` · ${tags.length} feature filter${tags.length > 1 ? "s" : ""}` : ""}`}
        </span>
      </div>

      {!loading && rows.length === 0 ? (
        <div className="empty">
          <div className="ico">◍</div>
          <h3>No listings match those filters</h3>
          <p>Try widening the region, clearing feature tags, or switching category.</p>
          <button className="btn btn-secondary" onClick={clearFilters}>
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="dir">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <DirRow key={l.slug} l={l} columns={columns} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="card-list">
            {rows.map((l) => {
              const rl = regionLabel(l);
              const vertical = l.industry.parent?.slug ?? l.industry.slug;
              return (
                <Link key={l.slug} href={`/company/${l.slug}`} className="dir-card" style={{ display: "block" }}>
                  <div className="top">
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
                  <div className="td-desc" style={{ marginBottom: 8 }}>
                    {l.shortDescription}
                  </div>
                  <div className="row-kv">
                    <span className="k">{vertical === "healthcare" ? "Beds" : "Capital"}</span>
                    <span className="mono">{vertical === "healthcare" ? l.bedCapacity ?? "—" : money(l.totalFunding)}</span>
                  </div>
                  <div className="row-kv">
                    <span className="k">Region</span>
                    <span>
                      <span className="cc">NG</span> {rl.name}
                      {rl.extra > 0 ? ` +${rl.extra}` : ""}
                    </span>
                  </div>
                  <div className="row-kv">
                    <span className="k">Status</span>
                    {verifyPill(l.verification)}
                  </div>
                  <div className="row-kv">
                    <span className="k">Activity</span>
                    <ActivityBadge company={l} />
                  </div>
                  <div style={{ marginTop: 12, textAlign: "right" }}>
                    <span className="explore-link">Explore deeper →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function regionLabel(l: CompanyRow) {
  const primary = l.regions.find((r) => r.isPrimary) ?? l.regions[0];
  const extra = l.regions.length - 1;
  return { name: primary?.region.name ?? "—", extra };
}

type ColDef = { key: string; label: string };

function columnDefsFor(category: string): ColDef[] {
  if (category === "fintech") {
    return [
      { key: "entity", label: "Entity" },
      { key: "description", label: "Description" },
      { key: "funding", label: "Capital Raised" },
      { key: "investors", label: "Investors" },
      { key: "region", label: "Region" },
      { key: "activity", label: "Activity" },
      { key: "socials", label: "Socials" },
      { key: "explore", label: "" },
    ];
  }
  if (category === "healthcare") {
    return [
      { key: "entity", label: "Entity" },
      { key: "location", label: "Location" },
      { key: "description", label: "Description" },
      { key: "specialties", label: "Specialties" },
      { key: "licence", label: "Reg. / Licence" },
      { key: "activity", label: "Activity" },
      { key: "explore", label: "" },
    ];
  }
  return [
    { key: "entity", label: "Entity" },
    { key: "category", label: "Category" },
    { key: "description", label: "Description" },
    { key: "region", label: "Region" },
    { key: "status", label: "Status" },
    { key: "activity", label: "Activity" },
    { key: "explore", label: "" },
  ];
}

function DirRow({ l, columns }: { l: CompanyRow; columns: ColDef[] }) {
  const rl = regionLabel(l);
  return (
    <tr>
      {columns.map((c) => (
        <Cell key={c.key} col={c.key} l={l} rl={rl} />
      ))}
    </tr>
  );
}

function Cell({ col, l, rl }: { col: string; l: CompanyRow; rl: { name: string; extra: number } }) {
  switch (col) {
    case "entity":
      return (
        <td>
          <Link className="ent" href={`/company/${l.slug}`} style={{ display: "flex" }}>
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
          </Link>
        </td>
      );
    case "category":
      return (
        <td>
          <span className="pill indigo">{l.industry.parent?.name ?? l.industry.name}</span>
        </td>
      );
    case "description":
      return <td className="td-desc">{l.shortDescription}</td>;
    case "funding":
      return <td className="cell-strong mono">{money(l.totalFunding)}</td>;
    case "investors": {
      const inv = l.investors ?? [];
      const first = inv[0]?.investor.name ?? "—";
      return (
        <td style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          {first}
          {inv.length > 1 && <span className="plus-more"> +{inv.length - 1}</span>}
        </td>
      );
    }
    case "region":
      return (
        <td>
          <span className="geo-chip">
            <span className="cc">NG</span> {rl.name}
            {rl.extra > 0 && <span className="plus-more"> +{rl.extra}</span>}
          </span>
        </td>
      );
    case "location":
      return (
        <td>
          <span className="geo-chip">
            <span className="cc">NG</span> {l.city || rl.name}
          </span>
        </td>
      );
    case "socials":
      return <td>{socialIcons(l.socials)}</td>;
    case "status":
      return <td>{verifyPill(l.verification)}</td>;
    case "activity":
      return (
        <td>
          <ActivityBadge company={l} />
        </td>
      );
    case "specialties": {
      const shown = l.tags.slice(0, 2);
      return (
        <td>
          {shown.map((t) => (
            <span key={t.slug} className="tag-mini">
              {t.name}
            </span>
          ))}
          {l.tags.length > 2 && <span className="plus-more">+{l.tags.length - 2}</span>}
        </td>
      );
    }
    case "licence":
      return (
        <td style={{ fontSize: 12.5 }}>
          <div className="cell-strong">{l.facilityBody || "—"}</div>
          <div className="ent-sub">{l.facilityNo || ""}</div>
        </td>
      );
    case "explore":
      return (
        <td style={{ textAlign: "right" }}>
          <Link className="explore-link" href={`/company/${l.slug}`}>
            Explore deeper →
          </Link>
        </td>
      );
    default:
      return <td>—</td>;
  }
}
