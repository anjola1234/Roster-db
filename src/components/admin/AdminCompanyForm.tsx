"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormOptions } from "@/lib/adminQueries";
import { LIFECYCLE_STATUSES, LISTING_STATUSES, VERIFICATION_STATUSES } from "@/lib/validation";
import { schemaForIndustry, type ExtensionField, type ExtensionSchema } from "@/lib/verticalSchemas";

/** Groups a schema's fields by their section, preserving declaration order. */
function sectionsOf(schema: ExtensionSchema): [string, ExtensionField[]][] {
  const map = new Map<string, ExtensionField[]>();
  for (const f of schema.fields) {
    const list = map.get(f.section) ?? [];
    list.push(f);
    map.set(f.section, list);
  }
  return Array.from(map.entries());
}

/**
 * Every value is held as a string (or string[]) because that's what form
 * controls produce; the server re-parses and coerces with `adminCompanySchema`,
 * which stays the single source of truth about what a valid listing is.
 */
export type CompanyFormValues = {
  name: string;
  slug: string;
  logoInitials: string;
  logoColor: string;
  industrySlug: string;
  regionSlugs: string[];
  primaryRegionSlug: string;
  tagSlugs: string[];
  shortDescription: string;
  longDescription: string;
  website: string;
  foundingYear: string;
  employeeRange: string;
  businessModel: string;
  regulator: string;
  registrationBody: string;
  registrationNumber: string;
  registrationLink: string;
  source: string;
  submittedByEmail: string;
  socialX: string;
  socialLinkedin: string;
  socialInstagram: string;
  socialFacebook: string;
  status: string;
  verification: string;
  lifecycleStatus: string;
  totalFunding: string;
  valuation: string;
  valuationDate: string;
  licenses: string;
  hospitalType: string;
  ownership: string;
  yearEstablished: string;
  bedCapacity: string;
  emergency: string;
  city: string;
  address: string;
  services: string;
  accreditation: string;
  accreditationBody: string;
  facilityBody: string;
  facilityNo: string;
  contactPhone: string;
  contactEmail: string;
};

export const EMPTY_COMPANY_FORM: CompanyFormValues = {
  name: "",
  slug: "",
  logoInitials: "",
  logoColor: "",
  industrySlug: "",
  regionSlugs: [],
  primaryRegionSlug: "",
  tagSlugs: [],
  shortDescription: "",
  longDescription: "",
  website: "",
  foundingYear: "",
  employeeRange: "",
  businessModel: "",
  regulator: "",
  registrationBody: "CAC (Nigeria)",
  registrationNumber: "",
  registrationLink: "",
  source: "",
  submittedByEmail: "",
  socialX: "",
  socialLinkedin: "",
  socialInstagram: "",
  socialFacebook: "",
  status: "draft",
  verification: "unverified",
  lifecycleStatus: "unverified",
  totalFunding: "",
  valuation: "",
  valuationDate: "",
  licenses: "",
  hospitalType: "",
  ownership: "",
  yearEstablished: "",
  bedCapacity: "",
  emergency: "",
  city: "",
  address: "",
  services: "",
  accreditation: "",
  accreditationBody: "",
  facilityBody: "",
  facilityNo: "",
  contactPhone: "",
  contactEmail: "",
};

type Props = {
  options: FormOptions;
  initial?: CompanyFormValues;
  companyId?: string;
};

export default function AdminCompanyForm({ options, initial, companyId }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<CompanyFormValues>(initial ?? EMPTY_COMPANY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(companyId);

  function set<K extends keyof CompanyFormValues>(key: K, value: CompanyFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  // Which extension schema applies is a function of the chosen category's
  // parent vertical — the same rule the public company page uses to decide
  // whether to render funding rounds or bed counts.
  // The selected category's vertical, and the extension schema it resolves to.
  const vertical = useMemo(() => {
    for (const v of options.verticals) {
      if (v.children.some((c) => c.slug === values.industrySlug)) return v;
    }
    return null;
  }, [options.verticals, values.industrySlug]);

  const activeSchema = useMemo(() => {
    if (!vertical) return null;
    const category = vertical.children.find((c) => c.slug === values.industrySlug);
    return schemaForIndustry(category ? { ...category, parent: vertical } : vertical);
  }, [vertical, values.industrySlug]);

  const availableTags = useMemo(
    () => options.features.filter((f) => !vertical || f.industry.slug === vertical.slug),
    [options.features, vertical],
  );

  function toggleRegion(slug: string) {
    setValues((v) => {
      const has = v.regionSlugs.includes(slug);
      const regionSlugs = has ? v.regionSlugs.filter((s) => s !== slug) : [...v.regionSlugs, slug];
      // Keep the primary honest: if it was just removed, or nothing is primary
      // yet, fall back to the first remaining selection.
      const primaryRegionSlug = regionSlugs.includes(v.primaryRegionSlug)
        ? v.primaryRegionSlug
        : (regionSlugs[0] ?? "");
      return { ...v, regionSlugs, primaryRegionSlug };
    });
  }

  function toggleTag(slug: string) {
    setValues((v) => ({
      ...v,
      tagSlugs: v.tagSlugs.includes(slug)
        ? v.tagSlugs.filter((s) => s !== slug)
        : [...v.tagSlugs, slug],
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(
        isEdit ? `/api/admin/companies/${companyId}` : "/api/admin/companies",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.field ? `${data.field}: ${data.error}` : (data.error ?? "Something went wrong."));
        setSaving(false);
        return;
      }
      router.push("/admin/companies");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <section className="panel">
        <h3 className="admin-section-title">Identity</h3>
        <div className="field">
          <label htmlFor="name">Company / institution name</label>
          <input
            id="name"
            required
            maxLength={150}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="slug">URL slug</label>
            <input
              id="slug"
              maxLength={200}
              placeholder={isEdit ? "" : "Generated from the name if left blank"}
              value={values.slug}
              onChange={(e) => set("slug", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="url"
              required
              maxLength={300}
              placeholder="https://example.com"
              value={values.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="logoInitials">Logo initials</label>
            <input
              id="logoInitials"
              maxLength={4}
              placeholder="Auto from name"
              value={values.logoInitials}
              onChange={(e) => set("logoInitials", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="logoColor">Logo colour</label>
            <input
              id="logoColor"
              placeholder="#4F46E5 — auto if blank"
              value={values.logoColor}
              onChange={(e) => set("logoColor", e.target.value)}
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
            value={values.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
          />
          <p className="field-hint">One line. Appears in the directory table.</p>
        </div>

        <div className="field">
          <label htmlFor="longDescription">Full description</label>
          <textarea
            id="longDescription"
            required
            minLength={20}
            maxLength={4000}
            value={values.longDescription}
            onChange={(e) => set("longDescription", e.target.value)}
          />
        </div>
      </section>

      <section className="panel">
        <h3 className="admin-section-title">Category &amp; coverage</h3>
        <div className="field">
          <label htmlFor="industrySlug">Category</label>
          <select
            id="industrySlug"
            required
            value={values.industrySlug}
            onChange={(e) => set("industrySlug", e.target.value)}
          >
            <option value="">Select…</option>
            {options.verticals.map((v) => (
              <optgroup key={v.slug} label={v.name}>
                {v.children.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {v.name} · {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="field-hint">
            Pick a category under a vertical — the vertical itself isn&apos;t selectable, and it
            decides which extra fields appear below.
          </p>
        </div>

        <fieldset className="admin-fieldset">
          <legend>Regions</legend>
          {/* Grouped by level so countries, states and cities are all
              attachable. A listing can sit at whatever granularity the data
              actually supports — country-only for a multinational, city-level
              for a single clinic. */}
          {(["country", "state", "city"] as const).map((level) => {
            const inLevel = options.regions.filter((r) => r.level === level);
            if (!inLevel.length) return null;
            return (
              <div key={level} className="admin-region-group">
                <p className="admin-region-level">{level}</p>
                <div className="admin-checks">
                  {inLevel.map((r) => (
                    <label key={r.slug} className="admin-check">
                      <input
                        type="checkbox"
                        checked={values.regionSlugs.includes(r.slug)}
                        onChange={() => toggleRegion(r.slug)}
                      />
                      {r.name}
                      {r.parent ? <span className="admin-muted"> · {r.parent.name}</span> : null}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </fieldset>

        {values.regionSlugs.length > 0 && (
          <div className="field">
            <label htmlFor="primaryRegionSlug">Primary region</label>
            <select
              id="primaryRegionSlug"
              value={values.primaryRegionSlug}
              onChange={(e) => set("primaryRegionSlug", e.target.value)}
            >
              {values.regionSlugs.map((slug) => (
                <option key={slug} value={slug}>
                  {options.regions.find((r) => r.slug === slug)?.name ?? slug}
                </option>
              ))}
            </select>
          </div>
        )}

        <fieldset className="admin-fieldset">
          <legend>
            Tags {vertical ? "" : "(pick a category first to narrow these)"}
          </legend>
          <div className="admin-checks">
            {availableTags.map((f) => (
              <label key={f.slug} className="admin-check">
                <input
                  type="checkbox"
                  checked={values.tagSlugs.includes(f.slug)}
                  onChange={() => toggleTag(f.slug)}
                />
                {f.name}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="panel">
        <h3 className="admin-section-title">Company details</h3>
        <div className="form-row">
          <div className="field">
            <label htmlFor="foundingYear">Founding year</label>
            <input
              id="foundingYear"
              type="number"
              min={1800}
              max={2100}
              value={values.foundingYear}
              onChange={(e) => set("foundingYear", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="employeeRange">Employee range</label>
            <input
              id="employeeRange"
              placeholder="51-200"
              value={values.employeeRange}
              onChange={(e) => set("employeeRange", e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="businessModel">Business model</label>
            <input
              id="businessModel"
              placeholder="B2B, B2C, B2B2C…"
              value={values.businessModel}
              onChange={(e) => set("businessModel", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="regulator">Regulator</label>
            <input
              id="regulator"
              placeholder="CBN, NHIS…"
              value={values.regulator}
              onChange={(e) => set("regulator", e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="registrationBody">Registration body</label>
            <input
              id="registrationBody"
              value={values.registrationBody}
              onChange={(e) => set("registrationBody", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="registrationNumber">Registration number</label>
            <input
              id="registrationNumber"
              placeholder="RC123456"
              value={values.registrationNumber}
              onChange={(e) => set("registrationNumber", e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="registrationLink">Registration record link</label>
          <input
            id="registrationLink"
            type="url"
            placeholder="https://…"
            value={values.registrationLink}
            onChange={(e) => set("registrationLink", e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="socialX">X / Twitter URL</label>
            <input
              id="socialX"
              type="url"
              value={values.socialX}
              onChange={(e) => set("socialX", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="socialLinkedin">LinkedIn URL</label>
            <input
              id="socialLinkedin"
              type="url"
              value={values.socialLinkedin}
              onChange={(e) => set("socialLinkedin", e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="socialInstagram">Instagram URL</label>
            <input
              id="socialInstagram"
              type="url"
              value={values.socialInstagram}
              onChange={(e) => set("socialInstagram", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="socialFacebook">Facebook URL</label>
            <input
              id="socialFacebook"
              type="url"
              value={values.socialFacebook}
              onChange={(e) => set("socialFacebook", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Vertical-specific fields, rendered from the extension schema that
          the *database* assigns to the selected category. Adding a category
          that reuses fintech's fields is a data change, not a code change —
          and a vertical with no extension simply renders nothing here. */}
      {activeSchema &&
        sectionsOf(activeSchema).map(([sectionName, fields]) => (
          <section className="panel" key={sectionName}>
            <h3 className="admin-section-title">
              {activeSchema.label} · {sectionName}
            </h3>
            {fields.map((f) => (
              <div className="field" key={f.column}>
                <label htmlFor={f.column}>{f.label}</label>
                {f.type === "boolean" ? (
                  <select
                    id={f.column}
                    value={String(values[f.column as keyof CompanyFormValues] ?? "")}
                    onChange={(e) => set(f.column as keyof CompanyFormValues, e.target.value)}
                  >
                    <option value="">Unknown</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : (
                  <input
                    id={f.column}
                    type={
                      f.type === "number" || f.type === "currency"
                        ? "number"
                        : f.type === "email"
                          ? "email"
                          : f.type === "url"
                            ? "url"
                            : "text"
                    }
                    min={f.min}
                    max={f.max}
                    step={f.type === "currency" ? "any" : undefined}
                    placeholder={f.placeholder}
                    value={String(values[f.column as keyof CompanyFormValues] ?? "")}
                    onChange={(e) => set(f.column as keyof CompanyFormValues, e.target.value)}
                  />
                )}
                {f.helpText && <p className="field-hint">{f.helpText}</p>}
              </div>
            ))}
          </section>
        ))}

      <section className="panel">
        <h3 className="admin-section-title">Publishing</h3>
        <div className="form-row">
          <div className="field">
            <label htmlFor="status">Listing status</label>
            <select id="status" value={values.status} onChange={(e) => set("status", e.target.value)}>
              {LISTING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="field-hint">Only <strong>active</strong> listings are public.</p>
          </div>
          <div className="field">
            <label htmlFor="verification">Verification</label>
            <select
              id="verification"
              value={values.verification}
              onChange={(e) => set("verification", e.target.value)}
            >
              {VERIFICATION_STATUSES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="lifecycleStatus">Lifecycle status</label>
            <select
              id="lifecycleStatus"
              value={values.lifecycleStatus}
              onChange={(e) => set("lifecycleStatus", e.target.value)}
            >
              {LIFECYCLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="field-hint">
              A human fact, never inferred — a website ping can&apos;t tell you a company was
              acquired.
            </p>
          </div>
          <div className="field">
            <label htmlFor="source">Source</label>
            <input
              id="source"
              placeholder="Where this data came from"
              value={values.source}
              onChange={(e) => set("source", e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="submittedByEmail">Submitter email</label>
          <input
            id="submittedByEmail"
            type="email"
            value={values.submittedByEmail}
            onChange={(e) => set("submittedByEmail", e.target.value)}
          />
          <p className="field-hint">Set automatically for public submissions.</p>
        </div>
      </section>

      {error && <p className="form-msg err">{error}</p>}

      <div className="admin-form-actions">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create listing"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => router.push("/admin/companies")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
