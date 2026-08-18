import { prisma } from "@/lib/prisma";

/**
 * ACTIVITY SIGNALS (spec section 4)
 *
 * The spec lists eight weighted signals — website, social, hiring, news,
 * product, leadership, public records, customer activity. We can honestly
 * observe some of them and not others, and the difference matters more than
 * the arithmetic.
 *
 * THE RULE THAT SHAPES EVERYTHING HERE: a signal we cannot observe scores
 * NOTHING, not zero. Treating "no LinkedIn API" as "no social activity" would
 * quietly drag a thriving company's score down and make the number a measure
 * of our integrations rather than of the company. So each signal reports
 * either a value with `measured: true`, or `measured: false` and no value —
 * and the weights are renormalised across only the measured ones.
 *
 * `coverage` (0–1) is the share of total weight we actually observed. It is
 * stored on every Score and shown in the UI, because a 90 built from one
 * signal deserves less confidence than a 90 built from five.
 *
 * The score NEVER changes a company's lifecycle status by itself. Spec
 * section 4 is explicit: automated signals → activity score → admin review →
 * verified status. A crawler can see a website is down; it cannot know the
 * company moved domains.
 */

export type SignalKey =
  | "website"
  | "website_content"
  | "customer_activity"
  | "funding_activity"
  | "data_freshness"
  | "social"
  | "hiring"
  | "news";

export type SignalResult = {
  key: SignalKey;
  /** 0–100 when measured; null when we have no way to observe it. */
  value: number | null;
  measured: boolean;
  /** Shown in the UI so a number is never unexplained. */
  detail: string;
};

export type SignalDefinition = {
  key: SignalKey;
  label: string;
  defaultWeight: number;
  /** False when no data source exists for it yet — surfaced honestly in the UI. */
  observable: boolean;
  description: string;
};

/**
 * Default weights follow the spec's table, adjusted for what we can see.
 * Anything not observable carries its spec weight but is excluded from every
 * calculation until a real source exists, so turning one on later is a data
 * change rather than a rebalancing exercise.
 */
export const SIGNAL_DEFINITIONS: SignalDefinition[] = [
  {
    key: "website",
    label: "Website reachability",
    defaultWeight: 0.3,
    observable: true,
    description: "Real HTTP checks: how often the site responded, and how recently.",
  },
  {
    key: "website_content",
    label: "Website changes",
    defaultWeight: 0.15,
    observable: true,
    description: "Whether the page content has changed between checks, via stored content hashes.",
  },
  {
    key: "customer_activity",
    label: "Customer activity",
    defaultWeight: 0.15,
    observable: true,
    description: "Published reviews on this listing, weighted towards recent ones.",
  },
  {
    key: "funding_activity",
    label: "Funding activity",
    defaultWeight: 0.2,
    observable: true,
    description: "Recency of the most recent recorded funding round.",
  },
  {
    key: "data_freshness",
    label: "Verification freshness",
    defaultWeight: 0.2,
    observable: true,
    description: "How recently a human last verified this listing.",
  },
  {
    key: "social",
    label: "Social activity",
    defaultWeight: 0.15,
    observable: false,
    description: "Needs a social platform API. No source connected, so it is never scored.",
  },
  {
    key: "hiring",
    label: "Hiring activity",
    defaultWeight: 0.15,
    observable: false,
    description: "Needs a jobs data source. No source connected, so it is never scored.",
  },
  {
    key: "news",
    label: "News mentions",
    defaultWeight: 0.1,
    observable: false,
    description: "Needs a news feed. No source connected, so it is never scored.",
  },
];

export const WEIGHTS_VERSION = "v2";

/**
 * A score is only published when enough of the picture was actually observed.
 *
 * Without this, a listing whose only measured signal was "verified recently"
 * scored 100 and was labelled "booming" off 14% coverage — a confident claim
 * about a company we know almost nothing about, and exactly the kind of
 * fabricated authority this system is supposed to avoid. Below these floors we
 * return no score at all, which the UI already renders as "Not checked".
 *
 * Deliberately conservative: an absent score prompts someone to go and check,
 * whereas a wrong one gets believed.
 */
export const MIN_COVERAGE = 0.35;
export const MIN_MEASURED_SIGNALS = 2;
const DAY = 86_400_000;

/** Linear decay from 100 at `fullDays` to 0 at `zeroDays`. */
function decay(date: Date | null | undefined, fullDays: number, zeroDays: number): number | null {
  if (!date) return null;
  const days = (Date.now() - new Date(date).getTime()) / DAY;
  if (days <= fullDays) return 100;
  if (days >= zeroDays) return 0;
  return Math.round(100 * (1 - (days - fullDays) / (zeroDays - fullDays)));
}

/** Current weights: admin overrides from ScoreWeight, else the defaults. */
export async function loadWeights(): Promise<Record<SignalKey, number>> {
  const rows = await prisma.scoreWeight.findMany({
    where: { scoreType: "activity", version: WEIGHTS_VERSION },
  });
  const weights = Object.fromEntries(
    SIGNAL_DEFINITIONS.map((d) => [d.key, d.defaultWeight]),
  ) as Record<SignalKey, number>;
  for (const row of rows) {
    if (row.component in weights) weights[row.component as SignalKey] = row.weight;
  }
  return weights;
}

// ---------------------------------------------------------------------------
// Individual signals
// ---------------------------------------------------------------------------

async function websiteSignals(companyId: string): Promise<[SignalResult, SignalResult]> {
  const since = new Date(Date.now() - 90 * DAY);
  const checks = await prisma.websiteCheck.findMany({
    where: { companyId, checkedAt: { gte: since } },
    orderBy: { checkedAt: "desc" },
    take: 30,
  });

  if (checks.length === 0) {
    return [
      { key: "website", value: null, measured: false, detail: "Never checked." },
      { key: "website_content", value: null, measured: false, detail: "Never checked." },
    ];
  }

  const reachable = checks.filter((c) => c.result === "reachable");
  const ratio = reachable.length / checks.length;
  const recency = decay(reachable[0]?.checkedAt ?? null, 7, 45) ?? 0;
  let value = Math.round(ratio * recency);

  // Current state outweighs a good history: a site that is down now is down.
  const latest = checks[0];
  const latestDown = latest.result !== "reachable";
  const lastThreeDown = checks.slice(0, 3).length === 3 && checks.slice(0, 3).every((c) => c.result !== "reachable");
  if (latestDown || lastThreeDown) value = Math.min(value, 20);

  const websiteSignal: SignalResult = {
    key: "website",
    value,
    measured: true,
    detail: `${reachable.length}/${checks.length} checks reachable; last success ${
      reachable[0] ? `${Math.round((Date.now() - reachable[0].checkedAt.getTime()) / DAY)}d ago` : "never"
    }.`,
  };

  // Content change needs at least two checks with hashes to say anything.
  const hashed = checks.filter((c) => c.contentHash);
  if (hashed.length < 2) {
    return [
      websiteSignal,
      {
        key: "website_content",
        value: null,
        measured: false,
        detail: "Needs at least two checks with content recorded.",
      },
    ];
  }
  const distinct = new Set(hashed.map((c) => c.contentHash)).size;
  const changed = distinct > 1;
  return [
    websiteSignal,
    {
      key: "website_content",
      value: changed ? 100 : 40,
      measured: true,
      detail: changed
        ? `Content changed across ${hashed.length} checks.`
        : `Identical content across ${hashed.length} checks — site may be static or unmaintained.`,
    },
  ];
}

async function customerActivity(companyId: string): Promise<SignalResult> {
  const reviews = await prisma.review.findMany({
    where: { companyId, status: "published" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (reviews.length === 0) {
    return {
      key: "customer_activity",
      value: null,
      measured: false,
      detail: "No published reviews — absence of reviews isn't evidence of inactivity.",
    };
  }
  const recency = decay(reviews[0].createdAt, 30, 365) ?? 0;
  // Volume is a mild bonus, capped so a handful of reviews can't dominate.
  const volume = Math.min(100, reviews.length * 10);
  return {
    key: "customer_activity",
    value: Math.round(recency * 0.7 + volume * 0.3),
    measured: true,
    detail: `${reviews.length} published review${reviews.length === 1 ? "" : "s"}, most recent ${Math.round(
      (Date.now() - reviews[0].createdAt.getTime()) / DAY,
    )}d ago.`,
  };
}

async function fundingActivity(companyId: string): Promise<SignalResult> {
  const round = await prisma.fundingRound.findFirst({
    where: { companyId },
    orderBy: { date: "desc" },
    select: { date: true, round: true },
  });
  if (!round) {
    return {
      key: "funding_activity",
      value: null,
      measured: false,
      detail: "No funding rounds recorded. Most organisations never raise — this is not a negative.",
    };
  }
  const date = new Date(round.date);
  if (Number.isNaN(date.getTime())) {
    return { key: "funding_activity", value: null, measured: false, detail: "Round date unparseable." };
  }
  return {
    key: "funding_activity",
    value: decay(date, 365, 365 * 4) ?? 0,
    measured: true,
    detail: `Most recent round: ${round.round} (${round.date}).`,
  };
}

async function dataFreshness(companyId: string): Promise<SignalResult> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { lastVerifiedAt: true },
  });
  if (!company?.lastVerifiedAt) {
    return {
      key: "data_freshness",
      value: null,
      measured: false,
      detail: "Never verified by a person.",
    };
  }
  return {
    key: "data_freshness",
    value: decay(company.lastVerifiedAt, 30, 365) ?? 0,
    measured: true,
    detail: `Last verified ${Math.round((Date.now() - company.lastVerifiedAt.getTime()) / DAY)}d ago.`,
  };
}

// ---------------------------------------------------------------------------
// Combined score
// ---------------------------------------------------------------------------

export type ActivityBreakdown = {
  score: number | null;
  band: string | null;
  coverage: number;
  signals: SignalResult[];
  weights: Record<SignalKey, number>;
  /** Weighted contribution each measured signal made to the final score. */
  contributions: Record<string, number>;
  /** True when signals exist but fall short of the floors — distinct from "nothing measured at all". */
  insufficient?: boolean;
};

export async function computeActivityBreakdown(companyId: string): Promise<ActivityBreakdown> {
  const weights = await loadWeights();
  const [websitePair, customer, funding, freshness] = await Promise.all([
    websiteSignals(companyId),
    customerActivity(companyId),
    fundingActivity(companyId),
    dataFreshness(companyId),
  ]);

  const measurable: SignalResult[] = [...websitePair, customer, funding, freshness];
  const unobservable: SignalResult[] = SIGNAL_DEFINITIONS.filter((d) => !d.observable).map((d) => ({
    key: d.key,
    value: null,
    measured: false,
    detail: d.description,
  }));
  const signals = [...measurable, ...unobservable];

  const measured = signals.filter((s) => s.measured && s.value !== null);
  const totalWeight = SIGNAL_DEFINITIONS.reduce((sum, d) => sum + weights[d.key], 0);
  const measuredWeight = measured.reduce((sum, s) => sum + weights[s.key], 0);

  // Coverage is against ALL weight, including signals we can't see, so it
  // honestly reports how much of the intended picture we actually have.
  const coverage = totalWeight > 0 ? measuredWeight / totalWeight : 0;

  if (
    measured.length < MIN_MEASURED_SIGNALS ||
    measuredWeight === 0 ||
    coverage < MIN_COVERAGE
  ) {
    return {
      score: null,
      band: null,
      coverage: Math.round(coverage * 100) / 100,
      signals,
      weights,
      contributions: {},
      insufficient: measured.length > 0,
    };
  }

  // Renormalise across measured weight only — this is what stops an absent
  // signal behaving like a zero.
  const contributions: Record<string, number> = {};
  let score = 0;
  for (const s of measured) {
    const share = weights[s.key] / measuredWeight;
    const contribution = (s.value as number) * share;
    contributions[s.key] = Math.round(contribution * 10) / 10;
    score += contribution;
  }

  return {
    score: Math.round(score),
    band: bandForScore(Math.round(score)),
    coverage: Math.round(coverage * 100) / 100,
    signals,
    weights,
    contributions,
  };
}

export function bandForScore(score: number): string {
  if (score >= 80) return "booming";
  if (score >= 60) return "growing";
  if (score >= 40) return "stable";
  if (score >= 20) return "quiet";
  return "dormant";
}

/**
 * Recomputes and persists. Writes Company.activityScore/Label for the existing
 * UI plus a Score row holding the full breakdown, so a number shown last month
 * can still be explained.
 */
export async function persistActivityScore(companyId: string): Promise<ActivityBreakdown> {
  const breakdown = await computeActivityBreakdown(companyId);
  const existing = await prisma.company.findUnique({
    where: { id: companyId },
    select: { activityScore: true },
  });

  await prisma.company.update({
    where: { id: companyId },
    data: {
      // activityScorePrev keeps the previous value so the band can express a
      // trend ("growing") rather than only a level.
      activityScorePrev: existing?.activityScore ?? null,
      activityScore: breakdown.score,
      activityLabel: breakdown.band,
    },
  });

  if (breakdown.score !== null) {
    await prisma.score.create({
      data: {
        companyId,
        scoreType: "activity",
        value: breakdown.score,
        band: breakdown.band,
        componentsJson: breakdown.contributions,
        coverage: breakdown.coverage,
        weightsVersion: WEIGHTS_VERSION,
      },
    });
  }

  return breakdown;
}
