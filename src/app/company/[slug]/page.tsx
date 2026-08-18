import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug, getRelatedCompanies, type CompanyFull } from "@/lib/queries";
import { heroImageUrl, money, formatDate, timeAgo } from "@/lib/format";
import ScrollSpyToc from "@/components/ScrollSpyToc";
import ReviewForm from "@/components/ReviewForm";
import ActivityBadge from "@/components/ActivityBadge";
import ClaimListingButton from "@/components/ClaimListingButton";
import { schemaForIndustry } from "@/lib/verticalSchemas";
import { SOURCE_KIND_LABELS, labelForFieldKey } from "@/lib/evidence";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) return { title: "Not found — IndexOne" };
  return { title: `${company.name} — IndexOne`, description: company.shortDescription };
}

function verifyPill(v: string) {
  if (v === "verified") return <span className="pill emerald">● Verified</span>;
  if (v === "flagged") return <span className="pill amber">⚑ Flagged</span>;
  return <span className="pill">○ Unverified</span>;
}

function socialIcons(s: unknown) {
  const map: Record<string, string> = { x: "𝕏", linkedin: "in", instagram: "IG", facebook: "f" };
  const obj = (s as Record<string, string> | null) ?? {};
  // Only render a handle we can actually navigate to. Several seeded listings
  // carry placeholder values ("#", ""), which previously rendered as icons
  // that looked live and went nowhere — worse than showing nothing.
  const keys = Object.keys(obj).filter((k) => {
    const url = obj[k];
    return typeof url === "string" && /^https?:\/\//i.test(url.trim());
  });
  if (!keys.length) return <span className="mono" style={{ color: "var(--faint)" }}>—</span>;
  return (
    <span className="socials">
      {keys.map((k) => (
        <a key={k} href={obj[k]} target="_blank" rel="noopener noreferrer" title={k}>
          {map[k] || k}
        </a>
      ))}
    </span>
  );
}

/**
 * Which extension schema this listing uses, resolved from the database rather
 * than a hardcoded slug comparison. A category inherits its vertical's schema,
 * so a new fintech sub-category gets funding fields automatically and a new
 * vertical gets base fields only — both without touching this file.
 */
function schemaFor(company: CompanyFull) {
  return schemaForIndustry(company.industry);
}

/** Funding history only makes sense for listings that track funding. */
function tracksFunding(company: CompanyFull) {
  return schemaFor(company)?.key === "fintech_schema";
}

function bestForBlock(company: CompanyFull) {
  const tagNames = company.tags.map((t) => t.name).slice(0, 5);
  if (tracksFunding(company)) {
    return {
      a: { h: "Best for", items: ["Everyday payments", "Merchants & agents", "Cross-border senders", "Underbanked users"] },
      b: { h: "What it does well", items: tagNames },
      c: { h: "Things to check", items: ["Regulatory licence scope", "Transaction limits", "Support responsiveness", "Country availability"] },
    };
  }
  return {
    a: { h: "Best for", items: ["Specialist care seekers", "Emergency access", "Insured (NHIA) patients", "Referrals from clinics"] },
    b: { h: "What it does well", items: tagNames },
    c: { h: "Things to check", items: ["Bed availability", "Accepted insurance", "Consultation hours", "Emergency capacity"] },
  };
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const related = await getRelatedCompanies(company, 3);

  // Whether this viewer already has a claim in flight on this listing, so the
  // claim widget can show state rather than letting them submit a duplicate.
  const viewer = await getCurrentUser();
  const existingClaim = viewer
    ? await prisma.listingClaim.findFirst({
        where: { companyId: company.id, userId: viewer.id, status: { in: ["pending", "approved"] } },
        select: { status: true },
      })
    : null;

  const verticalSlug = company.industry.parent?.slug ?? company.industry.slug;
  const verticalName = company.industry.parent?.name ?? company.industry.name;
  const bf = bestForBlock(company);
  const dist = (company.ratingDist as number[] | null) ?? [0, 0, 0, 0, 0];
  const primaryRegion = company.regions.find((r) => r.isPrimary) ?? company.regions[0];
  const extraRegions = company.regions.length - 1;

  const toc = [
    { id: "overview", num: "01", label: "Overview" },
    { id: "stats", num: "02", label: "Key stats" },
    { id: "website", num: "03", label: "Website" },
    // Section 04 depends on the listing's schema. A base-only listing (a law
    // firm, a university) gets no section 04 at all — before this, every
    // non-fintech listing was handed a "Clinical detail" heading, which was
    // nonsense for the sectors added after healthcare.
    ...(tracksFunding(company)
      ? [{ id: "funding", num: "04", label: "Funding & investors" }]
      : schemaFor(company)?.key === "hospitals_schema"
        ? [{ id: "clinical", num: "04", label: "Clinical detail" }]
        : []),
    { id: "people", num: "05", label: "People" },
    { id: "reviews", num: "06", label: "Ratings & reviews" },
    { id: "source", num: "07", label: "Source & verification" },
    { id: "related", num: "08", label: "Related" },
  ];

  return (
    <main>
      <div className="detail-wrap">
        <div className={`detail-hero cat-${verticalSlug}`} style={{ ["--hero-img" as string]: `url('${heroImageUrl(company.heroImageId, verticalSlug)}')` }}>
          <nav className="breadcrumb on-image">
            <Link href="/directory">Directory</Link>
            <span className="slash">/</span>
            <Link href={`/directory`}>{verticalName}</Link>
            <span className="slash">/</span>
            <span className="current">{company.name}</span>
          </nav>
        </div>

        <div className="identity-card">
          <div className="identity-inner">
            <div className="identity-logo" style={{ background: company.logoColor }}>
              {company.logoInitials}
            </div>
            <div className="identity-info">
              <h1>
                {company.name} {company.verification === "verified" && <span className="verified-badge">✔</span>}
              </h1>
              <div className="identity-meta">
                <span className="pill indigo">
                  {verticalName} · {company.industry.name}
                </span>
                <span className="geo-chip">
                  <span className="cc">NG</span> {primaryRegion?.region.name ?? "—"}
                  {extraRegions > 0 && <span className="plus-more"> +{extraRegions}</span>}
                </span>
                {verifyPill(company.verification)}
              </div>
              <p className="identity-desc">{company.shortDescription}</p>
              <div className="identity-tags tag-cloud">
                {company.tags.map((t) => (
                  <span key={t.slug} className="tag-mini">
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="identity-actions">
              <a className="btn btn-primary" href={company.website} target="_blank" rel="noopener noreferrer">
                Visit website ↗
              </a>
              <ClaimListingButton
                companySlug={company.slug}
                signedIn={Boolean(viewer)}
                existingStatus={existingClaim?.status ?? null}
              />
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <aside className="sidebar">
            <div className="side-card">
              <p className="eyebrow">Rating</p>
              <div className="side-rating">
                <span className="score">{(company.ratingScore ?? 0).toFixed(1)}</span>
                <span className="stars">★★★★★</span>
              </div>
            </div>
            <ScrollSpyToc items={toc} />
          </aside>

          <div className="content" id="io-content">
            <section className="blk" id="overview">
              <span className="eyebrow">§ 01 / Overview</span>
              <h3 className="blk-title">Is {company.name} right for you?</h3>
              <p className="lead">{company.longDescription}</p>
              <div className="panel">
                <div className="cols3">
                  <div className="col">
                    <h4>{bf.a.h}</h4>
                    <ul className="check-list">
                      {bf.a.items.map((i) => (
                        <li key={i}>
                          <span className="tick">✔</span> {i}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="col">
                    <h4>{bf.b.h}</h4>
                    <ul className="check-list">
                      {bf.b.items.map((i) => (
                        <li key={i}>
                          <span className="tick">✔</span> {i}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="col">
                    <h4>{bf.c.h}</h4>
                    <ul className="check-list watch">
                      {bf.c.items.map((i) => (
                        <li key={i}>
                          <span className="tick">◇</span> {i}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="blk" id="stats">
              <span className="eyebrow">§ 02 / Key stats</span>
              <h3 className="blk-title">At a glance</h3>
              {tracksFunding(company) ? (
                <div className="stat-grid">
                  <div className="stat">
                    <div className="k">Total funding</div>
                    <div className="v">{money(company.totalFunding)}</div>
                  </div>
                  <div className="stat">
                    <div className="k">Valuation</div>
                    <div className="v">{company.valuation ? money(company.valuation) : "—"}</div>
                  </div>
                  <div className="stat">
                    <div className="k">Founded</div>
                    <div className="v">{company.foundingYear ?? "—"}</div>
                  </div>
                  <div className="stat">
                    <div className="k">Employees</div>
                    <div className="v">{company.employeeRange ?? "—"}</div>
                  </div>
                  <div className="stat">
                    <div className="k">Model</div>
                    <div className="v">{company.businessModel ?? "—"}</div>
                  </div>
                  <div className="stat">
                    <div className="k">Regulator</div>
                    <div className="v" style={{ fontSize: 13 }}>
                      {company.regulator ?? "—"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="stat-grid">
                  <div className="stat">
                    <div className="k">Type</div>
                    <div className="v">{company.hospitalType ?? "—"}</div>
                  </div>
                  <div className="stat">
                    <div className="k">Ownership</div>
                    <div className="v">{company.ownership ?? "—"}</div>
                  </div>
                  <div className="stat">
                    <div className="k">Established</div>
                    <div className="v">{company.yearEstablished ?? "—"}</div>
                  </div>
                  <div className="stat">
                    <div className="k">Beds</div>
                    <div className="v">{company.bedCapacity ?? "—"}</div>
                  </div>
                  <div className="stat">
                    <div className="k">24/7 Emergency</div>
                    <div className="v">{company.emergency ? "Yes" : "No"}</div>
                  </div>
                  <div className="stat">
                    <div className="k">Accreditation</div>
                    <div className="v" style={{ fontSize: 13 }}>
                      {((company.accreditation as string[] | null) ?? []).join(", ") || "—"}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="blk" id="website">
              <span className="eyebrow">§ 03 / Website & presence</span>
              <h3 className="blk-title">Website & presence</h3>
              <div className="panel">
                <div className="kv-row">
                  <span className="kv-key">Website</span>
                  <span className="kv-val">
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      {company.website.replace("https://", "")} ↗
                    </a>
                  </span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">{schemaFor(company)?.addressLabel ?? "Address"}</span>
                  <span className="kv-val">{company.address || primaryRegion?.region.name || "—"}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Markets</span>
                  <span className="kv-val">
                    <span className="cc">NG</span> {primaryRegion?.region.name ?? "—"}
                    {extraRegions > 0 && ` +${extraRegions}`}
                  </span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Socials</span>
                  <span className="kv-val">{socialIcons(company.socials)}</span>
                </div>
              </div>

              <div className="activity-cards">
                <div className="activity-card">
                  <p className="eyebrow">Website activity</p>
                  <div style={{ margin: "10px 0" }}>
                    <ActivityBadge company={company} size="lg" />
                  </div>
                  <p className="ent-sub">
                    {company.websiteLastCheckedAt
                      ? `Last verified: ${timeAgo(company.websiteLastCheckedAt)}`
                      : "Not yet checked."}
                  </p>
                </div>
                <div className="activity-card">
                  <p className="eyebrow">Social activity</p>
                  <div style={{ margin: "10px 0" }}>
                    <span className="activity-badge lg act-darkgray">
                      <span className="act-line">
                        <span className="act-dot">⚫</span> Not yet monitored
                      </span>
                    </span>
                  </div>
                  <p className="ent-sub">
                    Social media monitoring (LinkedIn, X, Instagram, YouTube) is not yet wired up for any company.
                  </p>
                </div>
              </div>
            </section>

            {tracksFunding(company) ? (
              <section className="blk" id="funding">
                <span className="eyebrow">§ 04 / Funding & investors</span>
                <h3 className="blk-title">Funding history</h3>
                <div className="panel fund-timeline">
                  {company.fundingRounds.length ? (
                    company.fundingRounds
                      .slice()
                      .sort((a, b) => (a.date < b.date ? 1 : -1))
                      .map((r) => (
                        <div key={r.id} className="fund-row">
                          <div>
                            <div className="fund-round">{r.round}</div>
                            <div className="fund-date">{r.date}</div>
                          </div>
                          <div className="fund-lead">{r.leadInvestor}</div>
                          <div className="fund-amt">{money(r.amount)}</div>
                        </div>
                      ))
                  ) : (
                    <div className="fund-date">No disclosed rounds.</div>
                  )}
                </div>
                <h4 style={{ fontFamily: "var(--font-display)", margin: "28px 0 14px" }}>Investors</h4>
                <div className="inv-grid">
                  {Array.from(new Map(company.investors.map((ci) => [ci.investor.name, ci.investor])).values()).map((inv) => (
                    <div key={inv.name} className="inv-card">
                      <div className="inv-logo">{inv.name[0]}</div>
                      <div>
                        <div className="inv-name">{inv.name}</div>
                        <div className="inv-type">{inv.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <h4 style={{ fontFamily: "var(--font-display)", margin: "28px 0 14px" }}>Regulatory licences</h4>
                <div className="tag-cloud">
                  {((company.licenses as string[] | null) ?? []).length ? (
                    (company.licenses as string[]).map((x) => (
                      <span key={x} className="tag-mini">
                        {x}
                      </span>
                    ))
                  ) : (
                    <span className="fund-date">Not disclosed.</span>
                  )}
                </div>
              </section>
            ) : schemaFor(company)?.key === "hospitals_schema" ? (
              <section className="blk" id="clinical">
                <span className="eyebrow">§ 04 / Clinical detail</span>
                <h3 className="blk-title">Specialties & accreditation</h3>
                <div className="panel">
                  <div className="kv-row">
                    <span className="kv-key">Specialties</span>
                    <span className="kv-val">
                      <div className="tag-cloud" style={{ justifyContent: "flex-end" }}>
                        {company.tags.map((t) => (
                          <span key={t.slug} className="tag-mini">
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-key">Services</span>
                    <span className="kv-val">
                      <div className="tag-cloud" style={{ justifyContent: "flex-end" }}>
                        {((company.services as string[] | null) ?? []).map((s) => (
                          <span key={s} className="tag-mini">
                            {s}
                          </span>
                        )) || "—"}
                      </div>
                    </span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-key">Accreditation</span>
                    <span className="kv-val">
                      <div className="tag-cloud" style={{ justifyContent: "flex-end" }}>
                        {((company.accreditation as string[] | null) ?? []).map((a) => (
                          <span key={a} className="tag-mini">
                            {a}
                          </span>
                        ))}
                      </div>
                    </span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-key">Accrediting body</span>
                    <span className="kv-val">{company.accreditationBody || "—"}</span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-key">Facility licence</span>
                    <span className="kv-val">
                      {company.facilityBody || "—"} · <span className="mono">{company.facilityNo || ""}</span>
                    </span>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="blk" id="people">
              <span className="eyebrow">§ 05 / People</span>
              <h3 className="blk-title">Founders & leadership</h3>
              {company.listingPeople.length ? (
                <div className="people-grid">
                  {company.listingPeople.map((lp) => (
                    <div key={lp.id} className="person-card">
                      <div className="person-avatar">
                        {lp.person.name
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{lp.person.name}</div>
                        <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{lp.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--muted)" }}>Not disclosed.</p>
              )}
            </section>

            <section className="blk" id="reviews">
              <span className="eyebrow">§ 06 / Ratings & reviews</span>
              <h3 className="blk-title">Ratings & reviews</h3>
              <div className="panel">
                <div className="ratings-grid">
                  <div>
                    <div className="score-big">{(company.ratingScore ?? 0).toFixed(1)}</div>
                    <div className="stars">★★★★★</div>
                    <div className="score-sub">Based on {company.ratingCount} reviews</div>
                    <ReviewForm companySlug={company.slug} />
                  </div>
                  <div className="bars">
                    {[5, 4, 3, 2, 1].map((s, i) => (
                      <div key={s} className="bar-row">
                        <span className="bar-label">{s}-star</span>
                        <span className="bar-track">
                          <span className="bar-fill" style={{ width: `${dist[i] ?? 0}%` }} />
                        </span>
                        <span className="bar-pct">{dist[i] ?? 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {company.reviews.length > 0 && (
                <div className="panel" style={{ marginTop: 16 }}>
                  {company.reviews.map((r) => (
                    <div key={r.id} className="review-list-item">
                      <div className="head">
                        <strong>{r.authorName}</strong>
                        <span className="stars" style={{ margin: 0 }}>
                          {"★".repeat(r.rating)}
                          {"☆".repeat(5 - r.rating)}
                        </span>
                      </div>
                      <div className="ent-sub">{r.authorRole}</div>
                      <div className="title">{r.title}</div>
                      <div className="body">{r.body}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="blk" id="source">
              <span className="eyebrow">§ 07 / Source & verification</span>
              <h3 className="blk-title">Where this data comes from</h3>
              <div className="source-footer">
                <div className="sf-item">
                  <span className="k">Verification</span>
                  {verifyPill(company.verification)}
                </div>
                <div className="sf-item">
                  <span className="k">Primary source</span>
                  {company.source || "—"}
                </div>
                <div className="sf-item">
                  <span className="k">Last verified</span>
                  <span className="mono">{formatDate(company.lastVerifiedAt)}</span>
                </div>
                <div className="sf-item">
                  <span className="k">Listing status</span>
                  <span className="mono" style={{ textTransform: "capitalize" }}>
                    {company.status}
                  </span>
                </div>
              </div>

              {/* Per-field provenance. The four items above describe the
                  listing as a whole; this describes individual facts, which is
                  the distinction spec section 29 turns on. Only authoritative
                  rows appear — losing sources in a conflict stay internal. */}
              {company.fieldProvenance.length > 0 ? (
                <>
                  <table className="src-table">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Value on record</th>
                        <th>Source</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {company.fieldProvenance.map((p) => (
                        <tr key={p.id}>
                          <td>{labelForFieldKey(p.fieldKey)}</td>
                          <td className="src-value">{p.valueText}</td>
                          <td>
                            {p.sourceUrl ? (
                              <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">
                                {p.source.name} ↗
                              </a>
                            ) : (
                              p.source.name
                            )}
                            <span className="src-kind mono">
                              {SOURCE_KIND_LABELS[p.source.kind] ?? p.source.kind}
                            </span>
                          </td>
                          <td>
                            {p.verifiedAt ? (
                              <span className="pill emerald">✔ verified {formatDate(p.verifiedAt)}</span>
                            ) : (
                              <span className="pill">source recorded</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="src-note">
                    &ldquo;Verified&rdquo; means a person checked that value against the source
                    shown and put their name to it. &ldquo;Source recorded&rdquo; means there is a
                    citation but nobody has confirmed it — treat those as leads, not facts.
                  </p>
                </>
              ) : (
                <p className="src-note">
                  No per-field sources recorded yet. Details on this page come from the listing
                  itself and haven&apos;t been individually checked against a primary source.
                </p>
              )}
            </section>

            <section className="blk" id="related" style={{ paddingBottom: 0 }}>
              <span className="eyebrow">§ 08 / Related</span>
              <h3 className="blk-title">Similar {verticalName.toLowerCase()}</h3>
              <div className="related-grid">
                {related.map((r) => (
                  <Link key={r.slug} href={`/company/${r.slug}`} className="rel-card">
                    <div className="rel-top">
                      <div className="rel-logo" style={{ background: r.logoColor }}>
                        {r.logoInitials}
                      </div>
                      <div>
                        <div className="rel-name">{r.name}</div>
                        <div className="ent-sub">{r.industry.name}</div>
                      </div>
                    </div>
                    <div className="rel-desc">{r.shortDescription}</div>
                  </Link>
                ))}
              </div>
              <p className="proto-note">
                Sample directory data seeded for the IndexOne Nigeria pilot. Funding, licence and accreditation
                figures are illustrative — verify against the primary source before publishing.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
