"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Industry = { slug: string; name: string; children: { slug: string; name: string }[] };
type Region = { slug: string; name: string };

export default function ListProductForm({ industries, regions }: { industries: Industry[]; regions: Region[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [industrySlug, setIndustrySlug] = useState("");
  const [regionSlug, setRegionSlug] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [submittedByEmail, setSubmittedByEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          industrySlug,
          regionSlug,
          city,
          website,
          shortDescription,
          longDescription,
          submittedByEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push(`/company/${data.slug}`);
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="form-wide">
      <div className="auth-card">
        <h1>List your product</h1>
        <p className="lede">
          Submit your company or institution. New listings appear as <strong>unverified</strong> until reviewed.
        </p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="name">Company / institution name</label>
            <input id="name" required value={name} onChange={(e) => setName(e.target.value)} maxLength={150} />
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="industry">Industry</label>
              <select id="industry" required value={industrySlug} onChange={(e) => setIndustrySlug(e.target.value)}>
                <option value="">Select…</option>
                {industries.map((v) => (
                  <optgroup key={v.slug} label={v.name}>
                    {v.children.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {v.name} · {c.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="region">Region</label>
              <select id="region" required value={regionSlug} onChange={(e) => setRegionSlug(e.target.value)}>
                <option value="">Select…</option>
                {regions.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="city">City (optional)</label>
              <input id="city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={150} />
            </div>
            <div className="field">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                type="url"
                required
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                maxLength={300}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="shortDescription">Short description</label>
            <input
              id="shortDescription"
              required
              minLength={10}
              maxLength={300}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="longDescription">Full description</label>
            <textarea
              id="longDescription"
              required
              minLength={20}
              maxLength={4000}
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="submittedByEmail">Your email</label>
            <input
              id="submittedByEmail"
              type="email"
              required
              value={submittedByEmail}
              onChange={(e) => setSubmittedByEmail(e.target.value)}
              maxLength={200}
            />
          </div>

          {error && <p className="form-msg err">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
            {loading ? "Submitting…" : "Submit Listing"}
          </button>
        </form>
      </div>
    </div>
  );
}
