import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCompanyById, getFormOptions } from "@/lib/adminQueries";
import AdminCompanyForm, {
  EMPTY_COMPANY_FORM,
  type CompanyFormValues,
} from "@/components/admin/AdminCompanyForm";

/** Json array columns render as comma-separated text in the form. */
function listToText(value: unknown): string {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string").join(", ") : "";
}

function socialUrl(socials: unknown, key: string): string {
  const obj = (socials ?? {}) as Record<string, unknown>;
  return typeof obj[key] === "string" ? (obj[key] as string) : "";
}

function num(value: number | null): string {
  return value == null ? "" : String(value);
}

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [company, options] = await Promise.all([getAdminCompanyById(id), getFormOptions()]);
  if (!company) notFound();

  const initial: CompanyFormValues = {
    ...EMPTY_COMPANY_FORM,
    name: company.name,
    slug: company.slug,
    logoInitials: company.logoInitials,
    logoColor: company.logoColor,
    industrySlug: company.industry.slug,
    regionSlugs: company.regions.map((r) => r.region.slug),
    primaryRegionSlug:
      company.regions.find((r) => r.isPrimary)?.region.slug ??
      company.regions[0]?.region.slug ??
      "",
    tagSlugs: company.tags.map((t) => t.slug),
    shortDescription: company.shortDescription,
    longDescription: company.longDescription,
    website: company.website,
    foundingYear: num(company.foundingYear),
    employeeRange: company.employeeRange ?? "",
    businessModel: company.businessModel ?? "",
    regulator: company.regulator ?? "",
    registrationBody: company.registrationBody ?? "",
    registrationNumber: company.registrationNumber ?? "",
    registrationLink: company.registrationLink ?? "",
    source: company.source ?? "",
    submittedByEmail: company.submittedByEmail ?? "",
    socialX: socialUrl(company.socials, "x"),
    socialLinkedin: socialUrl(company.socials, "linkedin"),
    socialInstagram: socialUrl(company.socials, "instagram"),
    socialFacebook: socialUrl(company.socials, "facebook"),
    status: company.status,
    verification: company.verification,
    lifecycleStatus: company.lifecycleStatus,
    totalFunding: num(company.totalFunding),
    valuation: num(company.valuation),
    valuationDate: company.valuationDate ?? "",
    licenses: listToText(company.licenses),
    hospitalType: company.hospitalType ?? "",
    ownership: company.ownership ?? "",
    yearEstablished: num(company.yearEstablished),
    bedCapacity: num(company.bedCapacity),
    emergency: company.emergency == null ? "" : String(company.emergency),
    city: company.city ?? "",
    address: company.address ?? "",
    services: listToText(company.services),
    accreditation: listToText(company.accreditation),
    accreditationBody: company.accreditationBody ?? "",
    facilityBody: company.facilityBody ?? "",
    facilityNo: company.facilityNo ?? "",
    contactPhone: company.contactPhone ?? "",
    contactEmail: company.contactEmail ?? "",
  };

  return (
    <>
      <div className="admin-panel-head admin-page-head">
        <div>
          <h2>Edit {company.name}</h2>
          <p className="admin-lede mono">/company/{company.slug}</p>
        </div>
        <div className="admin-actions-row">
          <Link className="btn btn-ghost" href={`/admin/companies/${company.id}/evidence`}>
            Evidence &amp; sources
          </Link>
          <Link className="btn btn-ghost" href={`/company/${company.slug}`}>
            View public page ↗
          </Link>
          <Link className="btn btn-ghost" href="/admin/companies">
            ← Back
          </Link>
        </div>
      </div>

      <AdminCompanyForm options={options} initial={initial} companyId={company.id} />
    </>
  );
}
