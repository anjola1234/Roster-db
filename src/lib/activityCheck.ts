/**
 * Real website-reachability monitoring for the "company activity" system.
 *
 * This checks a company's actual website over the network (GET request,
 * parked-domain phrase sniffing, content hashing) and derives a 0-100
 * "activity score" from the resulting history. It never fabricates a score —
 * a company with zero checks stays at activityScore = null.
 *
 * Social media monitoring is explicitly OUT of scope here (no API access to
 * LinkedIn/X/Instagram/YouTube) — see `socialStatus` on Company, which just
 * stays "not_monitored".
 */
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { persistActivityScore } from "@/lib/activitySignals";
import type { Company } from "@/generated/prisma/client";

const MAX_BODY_BYTES = 200_000; // cap how much of the response body we read
const FETCH_TIMEOUT_MS = 10_000;

const PARKED_PHRASES = [
  "domain is for sale",
  "this domain is parked",
  "buy this domain",
  "domain may be for sale",
  "sedo.com",
  "godaddy.com/domainsearch",
  "future home of something quite cool",
  "account has been suspended",
  "this account has been suspended",
];

export type CheckResult = "reachable" | "unreachable" | "parked" | "error";

// ---------------------------------------------------------------------------
// Single-company check
// ---------------------------------------------------------------------------

export async function checkCompanyWebsite(
  company: Pick<Company, "id" | "website" | "websiteContentHash" | "lifecycleStatus">,
): Promise<{ result: CheckResult; httpStatus: number | null }> {
  let result: CheckResult;
  let httpStatus: number | null = null;
  let bodyText = "";
  let finalUrl: string | null = null;
  let responseMs: number | null = null;
  let errorNote: string | null = null;

  const startedAt = Date.now();
  try {
    const res = await fetch(company.website, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    responseMs = Date.now() - startedAt;
    httpStatus = res.status;
    finalUrl = res.url || null;

    // Read the body but cap how much we buffer — some sites/CDNs stream huge
    // pages and we only need enough text to sniff parked-domain phrases.
    const raw = await res.text();
    bodyText = raw.slice(0, MAX_BODY_BYTES).toLowerCase();

    const isParked = PARKED_PHRASES.some((phrase) => bodyText.includes(phrase));
    if (isParked) {
      result = "parked";
    } else if (res.status >= 200 && res.status < 300) {
      result = "reachable";
    } else {
      result = "unreachable";
    }
  } catch (e) {
    // Network error, DNS failure, or fetch timeout.
    result = "error";
    errorNote = e instanceof Error ? e.message : "Unknown fetch error";
  }

  const isUp = result === "reachable";

  // Content-change tracking: hash the normalized body and compare against
  // whatever we stored last time.
  const contentHash = bodyText ? createHash("sha256").update(bodyText).digest("hex") : null;
  const now = new Date();
  if (contentHash && contentHash !== company.websiteContentHash) {
    await prisma.company.update({
      where: { id: company.id },
      data: { websiteLastChangedAt: now, websiteContentHash: contentHash },
    });
  }

  // Record this check in history. SSL/domain-expiry/lighthouse fields are
  // left null — no WHOIS/RDAP or Lighthouse integration exists yet, and we
  // never fabricate a value for those.
  await prisma.websiteCheck.create({
    data: {
      companyId: company.id,
      url: company.website,
      httpStatus,
      isUp,
      responseMs,
      finalUrl,
      errorNote,
      result,
      checkedAt: now,
      contentHash,
    },
  });

  // Recompute the score from history (including the check we just inserted)
  // and persist it as a new Score row (scoreType="activity") + the
  // denormalized Company columns kept for fast reads.
  await prisma.company.update({
    where: { id: company.id },
    data: {
      websiteStatus: result,
      websiteLastCheckedAt: now,
      websiteContentHash: contentHash ?? company.websiteContentHash,
      // Lifecycle status is DELIBERATELY not touched here.
      //
      // This used to promote "unverified" to "operating" on a company's first
      // successful check. Spec sections 4 and 20 are explicit that automated
      // signals feed the score, and a human decides the status — a crawler can
      // see that a site responds, but not whether the company behind it was
      // acquired, renamed or is a parked shell. The reachability result is
      // recorded above and shown to admins; promoting it to a verified fact is
      // their call, in /admin/activity.
    },
  });

  // Score is recomputed across every signal, not just this check.
  await persistActivityScore(company.id);

  return { result, httpStatus };
}

// ---------------------------------------------------------------------------
// Scoring heuristic
//
// This formula is a tunable starting point, not verified fact:
//   - reachableRatio = fraction of the recent checks (last ~10, or last 90
//     days, whichever is the smaller window) with result === "reachable"
//   - recencyFactor = 1.0 if the most recent successful "reachable" check
//     was within 7 days, decaying linearly to 0.0 at 90+ days since the last
//     successful check (0 if there is no successful check in history at all)
//   - score = round(100 * reachableRatio * recencyFactor)
//   - Override: if the single most recent check OR the last 3 consecutive
//     checks are all "parked" or all "unreachable"/"error", cap the score at
//     14 — a site that just went parked/down shouldn't still read "Active"
//     off good history from months ago.
// ---------------------------------------------------------------------------

const RECENT_CHECK_LIMIT = 10;
const RECENT_WINDOW_DAYS = 90;
const RECENCY_FULL_DAYS = 7;
const RECENCY_ZERO_DAYS = 90;
const DOWN_STATE_CAP = 14;

export async function computeActivityScore(companyId: string): Promise<number | null> {
  const since = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const allRecent = await prisma.websiteCheck.findMany({
    where: { companyId, checkedAt: { gte: since } },
    orderBy: { checkedAt: "desc" },
    take: RECENT_CHECK_LIMIT,
  });

  if (allRecent.length === 0) {
    // Zero checks ever (or none within the window) — never fabricate a score.
    return null;
  }

  const reachableCount = allRecent.filter((c) => c.result === "reachable").length;
  const reachableRatio = reachableCount / allRecent.length;

  const lastSuccessful = allRecent.find((c) => c.result === "reachable");
  let recencyFactor: number;
  if (!lastSuccessful) {
    recencyFactor = 0;
  } else {
    const daysSince = (Date.now() - lastSuccessful.checkedAt.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSince <= RECENCY_FULL_DAYS) recencyFactor = 1;
    else if (daysSince >= RECENCY_ZERO_DAYS) recencyFactor = 0;
    else
      recencyFactor =
        1 - (daysSince - RECENCY_FULL_DAYS) / (RECENCY_ZERO_DAYS - RECENCY_FULL_DAYS);
  }

  let score = Math.round(100 * reachableRatio * recencyFactor);

  // Override: recent state matters more than historical average.
  const mostRecent = allRecent[0];
  const last3 = allRecent.slice(0, 3);
  const mostRecentIsDown = mostRecent.result === "parked" || mostRecent.result === "unreachable" || mostRecent.result === "error";
  const last3AllParked = last3.length === 3 && last3.every((c) => c.result === "parked");
  const last3AllDown = last3.length === 3 && last3.every((c) => c.result === "unreachable" || c.result === "error");
  if (mostRecentIsDown || last3AllParked || last3AllDown) {
    score = Math.min(score, DOWN_STATE_CAP);
  }

  return score;
}

// Exported so the UI can independently label a score it already has
// (e.g. re-deriving the base band without a trend comparison).
export function labelForScore(score: number, previousScore: number | null | undefined): string {
  if (score >= 85 && previousScore != null && score - previousScore >= 5) return "growing";
  if (score >= 60) return "active";
  if (score >= 35) return "low_activity";
  if (score >= 15) return "at_risk";
  return "dormant";
}

// ---------------------------------------------------------------------------
// Batch runner
// ---------------------------------------------------------------------------

const CONCURRENCY = 5;

export async function checkAllCompanies(): Promise<{
  total: number;
  reachable: number;
  unreachable: number;
  parked: number;
  error: number;
}> {
  const companies = await prisma.company.findMany({
    where: { lifecycleStatus: { in: ["operating", "unverified"] } },
    select: { id: true, website: true, websiteContentHash: true, lifecycleStatus: true },
  });

  const counts = { total: companies.length, reachable: 0, unreachable: 0, parked: 0, error: 0 };

  // Simple batching loop — cap concurrency at CONCURRENCY so we don't hammer
  // every company's site in parallel unbounded, and this scales as the
  // directory grows.
  for (let i = 0; i < companies.length; i += CONCURRENCY) {
    const batch = companies.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (company) => {
        try {
          return await checkCompanyWebsite(company);
        } catch {
          return { result: "error" as CheckResult, httpStatus: null };
        }
      }),
    );
    for (const r of results) {
      counts[r.result] += 1;
    }
  }

  return counts;
}
