"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ActivityBadge from "@/components/ActivityBadge";

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

function verifyPill(v: string) {
  if (v === "verified") return <span className="pill emerald">● Verified</span>;
  if (v === "flagged") return <span className="pill amber">⚑ Flagged</span>;
  return <span className="pill">○ Unverified</span>;
}

export default function DirectoryPreview({ industries, regions }: { industries: Industry[]; regions: Region[] }) {
  const [vertical, setVertical] = useState("all");
  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  const subOptions = useMemo(() => {
    if (vertical === "all") return [];
    return industries.find((i) => i.slug === vertical)?.children ?? [];
  }, [vertical, industries]);

  const [subVertical, setSubVertical] = useState("all");

  // Changing the vertical also resets the dependent sub-vertical filter.
  // Done inside the event handler (not an effect) so it's a single render.
  function selectVertical(next: string) {
    setVertical(next);
    setSubVertical("all");
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (subVertical !== "all") params.set("industry", subVertical);
    else if (vertical !== "all") params.set("vertical", vertical);
    if (region !== "all") params.set("region", region);
    if (status !== "all") params.set("status", status);
    params.set("limit", "10");

    // Standard fetch-in-effect loading pattern: setLoading(true) fires
    // synchronously so the UI shows a loading state immediately, before the
    // async request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/companies?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setRows(data.companies ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [vertical, subVertical, region, status]);

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-row">
          <div className="filter-group">
            <span className="filter-label">Industry</span>
            <select className="control" value={vertical} onChange={(e) => selectVertical(e.target.value)}>
              <option value="all">All industries</option>
              {industries.map((i) => (
                <option key={i.slug} value={i.slug}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          {vertical !== "all" && (
            <div className="filter-group">
              <span className="filter-label">Type</span>
              <select className="control" value={subVertical} onChange={(e) => setSubVertical(e.target.value)}>
                <option value="all">All types</option>
                {subOptions.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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
        </div>
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
                        <div className="ent-sub">{l.industry.parent?.name ?? l.industry.name} · {l.industry.name}</div>
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
