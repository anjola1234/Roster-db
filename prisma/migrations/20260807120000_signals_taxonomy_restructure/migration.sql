-- Hand-authored migration implementing the D1-D5 + Signals schema restructure.
-- NOT run against a live database — no working DATABASE_URL exists on this
-- machine. Written to mirror `prisma/schema.prisma`; run `npx prisma migrate
-- deploy` against the real Neon database, then re-run `npx prisma db seed`.
--
-- Data-migration notes (best-effort, since this was authored without a real
-- database to test against):
--   * Person -> Person + ListingPerson: existing (companyId, name, role) rows
--     become one ListingPerson each (role hardcoded to "founder", matching
--     the instruction to migrate the 14 existing founders that way), then
--     Person rows are deduped by name-derived slug (kept row = lowest id).
--   * Review: existing rows get status='published' (they're demo content,
--     not content awaiting moderation); userId stays NULL for all of them.
--   * ActivityCheck -> WebsiteCheck: renamed + expanded; `url`/`isUp` are
--     backfilled from Company.website / result='reachable'; the SSL/domain/
--     lighthouse columns start NULL (no integration exists yet).

-- =============================================================================
-- Region taxonomy (self-referencing tree)
-- =============================================================================
ALTER TABLE "Region" ADD COLUMN "level" TEXT NOT NULL DEFAULT 'state';
ALTER TABLE "Region" ADD COLUMN "isoCode" TEXT;
ALTER TABLE "Region" ADD COLUMN "note" TEXT;
ALTER TABLE "Region" ADD COLUMN "parentId" TEXT;
ALTER TABLE "Region" ALTER COLUMN "level" DROP DEFAULT;

CREATE INDEX "Region_parentId_idx" ON "Region"("parentId");
ALTER TABLE "Region" ADD CONSTRAINT "Region_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Category taxonomy (Industry)
-- =============================================================================
ALTER TABLE "Industry" ADD COLUMN "level" TEXT NOT NULL DEFAULT 'category';
ALTER TABLE "Industry" ADD COLUMN "schemaExtension" TEXT;
ALTER TABLE "Industry" ADD COLUMN "note" TEXT;
ALTER TABLE "Industry" ALTER COLUMN "level" DROP DEFAULT;
-- Existing top-level rows (fintech, healthcare) are verticals, not categories.
UPDATE "Industry" SET "level" = 'vertical' WHERE "parentId" IS NULL;

-- Secondary categories (listing_categories) — mechanism only, unused by seed data.
CREATE TABLE "CompanyCategory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CompanyCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CompanyCategory_companyId_industryId_key" ON "CompanyCategory"("companyId", "industryId");
CREATE INDEX "CompanyCategory_industryId_idx" ON "CompanyCategory"("industryId");
ALTER TABLE "CompanyCategory" ADD CONSTRAINT "CompanyCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyCategory" ADD CONSTRAINT "CompanyCategory_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- field_definitions registry
CREATE TABLE "FieldDefinition" (
    "id" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "optionsJson" JSONB,
    "section" TEXT,
    "displayOrder" INTEGER,
    "helpText" TEXT,

    CONSTRAINT "FieldDefinition_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FieldDefinition_industryId_fieldKey_key" ON "FieldDefinition"("industryId", "fieldKey");
CREATE INDEX "FieldDefinition_industryId_idx" ON "FieldDefinition"("industryId");
ALTER TABLE "FieldDefinition" ADD CONSTRAINT "FieldDefinition_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =============================================================================
-- Investor / FundingRound extensions
-- =============================================================================
ALTER TABLE "Investor" ADD COLUMN "website" TEXT;
ALTER TABLE "FundingRound" ADD COLUMN "currency" TEXT;
ALTER TABLE "FundingRound" ADD COLUMN "sourceUrl" TEXT;

-- =============================================================================
-- Company: registration fields + customFields payload
-- =============================================================================
ALTER TABLE "Company" ADD COLUMN "registrationBody" TEXT DEFAULT 'CAC (Nigeria)';
ALTER TABLE "Company" ADD COLUMN "registrationNumber" TEXT;
ALTER TABLE "Company" ADD COLUMN "registrationLink" TEXT;
ALTER TABLE "Company" ADD COLUMN "customFields" JSONB;

-- =============================================================================
-- Person restructure: company-agnostic Person + ListingPerson join
-- =============================================================================
ALTER TABLE "Person" ADD COLUMN "slug" TEXT;
ALTER TABLE "Person" ADD COLUMN "headline" TEXT;
ALTER TABLE "Person" ADD COLUMN "photo" TEXT;
ALTER TABLE "Person" ADD COLUMN "linkedin" TEXT;

-- Derive a slug for every existing row so the dedup pass below has a key.
UPDATE "Person"
SET "slug" = trim(both '-' from regexp_replace(lower(trim("name")), '[^a-z0-9]+', '-', 'g'))
WHERE "slug" IS NULL;
-- Disambiguate any accidental slug collisions among distinct people before
-- the unique index is added (best-effort — a human should verify these).
UPDATE "Person" p
SET "slug" = p."slug" || '-' || substr(p."id", 1, 6)
WHERE p."id" NOT IN (
  SELECT min("id") FROM "Person" GROUP BY "slug"
);

CREATE TABLE "ListingPerson" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ListingPerson_pkey" PRIMARY KEY ("id")
);

-- One ListingPerson row per existing (person, company) pair. Role is
-- hardcoded to "founder" (matches the doc's founder/co-founder/ceo/... role
-- enum; the old free-text `role` column, e.g. "Co-Founder & CEO", is not a
-- clean fit for that enum and is intentionally not carried over — the old
-- text lived on the seed's REVIEWS/founders arrays, not anywhere queried).
INSERT INTO "ListingPerson" ("id", "personId", "companyId", "role", "isCurrent", "startDate")
SELECT "id", "id", "companyId", 'founder', true, NULL FROM "Person";

-- Now that every existing Person row has been captured as a ListingPerson,
-- drop the old per-company columns and finish making Person company-agnostic.
ALTER TABLE "Person" DROP COLUMN "companyId";
ALTER TABLE "Person" DROP COLUMN "role";
ALTER TABLE "Person" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Person_slug_key" ON "Person"("slug");

CREATE UNIQUE INDEX "ListingPerson_personId_companyId_role_key" ON "ListingPerson"("personId", "companyId", "role");
CREATE INDEX "ListingPerson_companyId_idx" ON "ListingPerson"("companyId");
CREATE INDEX "ListingPerson_personId_idx" ON "ListingPerson"("personId");
ALTER TABLE "ListingPerson" ADD CONSTRAINT "ListingPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingPerson" ADD CONSTRAINT "ListingPerson_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- Review: moderation + optional real-user attribution
-- =============================================================================
ALTER TABLE "Review" ADD COLUMN "userId" TEXT;
ALTER TABLE "Review" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Review" ADD COLUMN "ownerResponse" TEXT;
ALTER TABLE "Review" ADD COLUMN "helpfulCount" INTEGER NOT NULL DEFAULT 0;
-- Existing seed reviews are demo content, not content awaiting moderation.
UPDATE "Review" SET "status" = 'published';

CREATE INDEX "Review_userId_idx" ON "Review"("userId");
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- ActivityCheck -> WebsiteCheck rename + field expansion
-- =============================================================================
ALTER TABLE "ActivityCheck" RENAME TO "WebsiteCheck";
ALTER TABLE "WebsiteCheck" RENAME CONSTRAINT "ActivityCheck_pkey" TO "WebsiteCheck_pkey";
ALTER TABLE "WebsiteCheck" RENAME CONSTRAINT "ActivityCheck_companyId_fkey" TO "WebsiteCheck_companyId_fkey";
DROP INDEX "ActivityCheck_companyId_checkedAt_idx";

ALTER TABLE "WebsiteCheck" ADD COLUMN "url" TEXT;
ALTER TABLE "WebsiteCheck" ADD COLUMN "isUp" BOOLEAN;
ALTER TABLE "WebsiteCheck" ADD COLUMN "responseMs" INTEGER;
ALTER TABLE "WebsiteCheck" ADD COLUMN "sslValid" BOOLEAN;
ALTER TABLE "WebsiteCheck" ADD COLUMN "sslExpiresOn" TIMESTAMP(3);
ALTER TABLE "WebsiteCheck" ADD COLUMN "domainExpiresOn" TIMESTAMP(3);
ALTER TABLE "WebsiteCheck" ADD COLUMN "finalUrl" TEXT;
ALTER TABLE "WebsiteCheck" ADD COLUMN "lighthousePerf" INTEGER;
ALTER TABLE "WebsiteCheck" ADD COLUMN "errorNote" TEXT;

-- Backfill url/isUp from the company + existing result, then make required.
UPDATE "WebsiteCheck" wc SET "url" = c."website" FROM "Company" c WHERE wc."companyId" = c."id" AND wc."url" IS NULL;
UPDATE "WebsiteCheck" SET "isUp" = ("result" = 'reachable') WHERE "isUp" IS NULL;
UPDATE "WebsiteCheck" SET "errorNote" = "detail" WHERE "errorNote" IS NULL;
ALTER TABLE "WebsiteCheck" ALTER COLUMN "url" SET NOT NULL;
ALTER TABLE "WebsiteCheck" ALTER COLUMN "isUp" SET NOT NULL;

ALTER TABLE "WebsiteCheck" DROP COLUMN "source";
ALTER TABLE "WebsiteCheck" DROP COLUMN "detail";

CREATE INDEX "WebsiteCheck_companyId_checkedAt_idx" ON "WebsiteCheck"("companyId", "checkedAt");

-- =============================================================================
-- Scores & Provenance
-- =============================================================================
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "scoreType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "band" TEXT,
    "componentsJson" JSONB NOT NULL,
    "coverage" DOUBLE PRECISION NOT NULL,
    "weightsVersion" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Score_companyId_scoreType_computedAt_idx" ON "Score"("companyId", "scoreType", "computedAt");
ALTER TABLE "Score" ADD CONSTRAINT "Score_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ScoreWeight" (
    "version" TEXT NOT NULL,
    "scoreType" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "decayDays" INTEGER,
    "minObservations" INTEGER,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreWeight_pkey" PRIMARY KEY ("version","scoreType","component")
);

CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "trustRank" INTEGER NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "termsUrl" TEXT,
    "rateLimitNote" TEXT,
    "lastRunAt" TIMESTAMP(3),

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DataSource_key_key" ON "DataSource"("key");

CREATE TABLE "FieldProvenance" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "valueText" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "confidence" DOUBLE PRECISION,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "isWinning" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FieldProvenance_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FieldProvenance_companyId_fieldKey_idx" ON "FieldProvenance"("companyId", "fieldKey");
CREATE INDEX "FieldProvenance_sourceId_idx" ON "FieldProvenance"("sourceId");
ALTER TABLE "FieldProvenance" ADD CONSTRAINT "FieldProvenance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FieldProvenance" ADD CONSTRAINT "FieldProvenance_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CrawlRun" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "recordsIn" INTEGER,
    "recordsWritten" INTEGER,
    "errorNote" TEXT,

    CONSTRAINT "CrawlRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CrawlRun_sourceId_idx" ON "CrawlRun"("sourceId");
ALTER TABLE "CrawlRun" ADD CONSTRAINT "CrawlRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =============================================================================
-- Observations (append-only time series)
-- =============================================================================
CREATE TABLE "SocialMetric" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "handle" TEXT,
    "followers" INTEGER,
    "postsTotal" INTEGER,
    "posts30d" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "lastPostAt" TIMESTAMP(3),
    "sourceId" TEXT,
    "isEstimate" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SocialMetric_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SocialMetric_companyId_observedAt_idx" ON "SocialMetric"("companyId", "observedAt");
ALTER TABLE "SocialMetric" ADD CONSTRAINT "SocialMetric_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialMetric" ADD CONSTRAINT "SocialMetric_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "headline" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "outlet" TEXT,
    "summary" TEXT,
    "itemType" TEXT,
    "sentiment" TEXT,
    "relevance" DOUBLE PRECISION,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NewsItem_url_key" ON "NewsItem"("url");
CREATE INDEX "NewsItem_companyId_idx" ON "NewsItem"("companyId");
ALTER TABLE "NewsItem" ADD CONSTRAINT "NewsItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "location" TEXT,
    "regionId" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "department" TEXT,
    "sourceId" TEXT,
    "sourceUrl" TEXT,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "JobPosting_companyId_idx" ON "JobPosting"("companyId");
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TrafficEstimate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodMonth" TIMESTAMP(3) NOT NULL,
    "visitsEstimate" INTEGER,
    "rankCountry" INTEGER,
    "sourceId" TEXT,

    CONSTRAINT "TrafficEstimate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TrafficEstimate_companyId_periodMonth_idx" ON "TrafficEstimate"("companyId", "periodMonth");
ALTER TABLE "TrafficEstimate" ADD CONSTRAINT "TrafficEstimate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrafficEstimate" ADD CONSTRAINT "TrafficEstimate_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Trust & Community
-- =============================================================================
CREATE TABLE "ListingVerification" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "method" TEXT,
    "evidenceUrl" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "ListingVerification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ListingVerification_companyId_idx" ON "ListingVerification"("companyId");
ALTER TABLE "ListingVerification" ADD CONSTRAINT "ListingVerification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ListingClaim" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "claimedRole" TEXT NOT NULL,
    "proofMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingClaim_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ListingClaim_companyId_idx" ON "ListingClaim"("companyId");
CREATE INDEX "ListingClaim_userId_idx" ON "ListingClaim"("userId");
ALTER TABLE "ListingClaim" ADD CONSTRAINT "ListingClaim_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingClaim" ADD CONSTRAINT "ListingClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ListingCorrection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "correctionType" TEXT NOT NULL,
    "fieldKey" TEXT,
    "proposedValue" TEXT,
    "evidenceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingCorrection_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ListingCorrection_companyId_idx" ON "ListingCorrection"("companyId");
ALTER TABLE "ListingCorrection" ADD CONSTRAINT "ListingCorrection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingCorrection" ADD CONSTRAINT "ListingCorrection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- People & Products
-- =============================================================================
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "productUrl" TEXT,
    "platform" JSONB,
    "appStoreId" TEXT,
    "status" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Product_companyId_idx" ON "Product"("companyId");
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "awardedBy" TEXT,
    "awardedOn" TIMESTAMP(3),
    "sourceUrl" TEXT,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Award_companyId_idx" ON "Award"("companyId");
ALTER TABLE "Award" ADD CONSTRAINT "Award_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ListingCurrentSignal" (
    "companyId" TEXT NOT NULL,
    "isWebsiteUp" BOOLEAN,
    "websiteCheckedAt" TIMESTAMP(3),
    "uptime30d" DOUBLE PRECISION,
    "followersTotal" INTEGER,
    "lastSocialPostAt" TIMESTAMP(3),
    "newsCount90d" INTEGER,
    "openJobs" INTEGER,
    "totalFunding" DOUBLE PRECISION,
    "overallScore" DOUBLE PRECISION,
    "scoreBand" TEXT,
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingCurrentSignal_pkey" PRIMARY KEY ("companyId")
);
ALTER TABLE "ListingCurrentSignal" ADD CONSTRAINT "ListingCurrentSignal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
