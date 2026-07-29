-- CreateTable
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "accent" TEXT,
    "parentId" TEXT,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyRegion" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CompanyRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyInvestor" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "fundingRoundId" TEXT,

    CONSTRAINT "CompanyInvestor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingRound" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "leadInvestor" TEXT,

    CONSTRAINT "FundingRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoInitials" TEXT NOT NULL,
    "logoColor" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "heroImageId" TEXT,
    "socials" JSONB,
    "foundingYear" INTEGER,
    "employeeRange" TEXT,
    "businessModel" TEXT,
    "regulator" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "verification" TEXT NOT NULL DEFAULT 'unverified',
    "source" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "submittedByEmail" TEXT,
    "ratingScore" DOUBLE PRECISION,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "ratingDist" JSONB,
    "totalFunding" DOUBLE PRECISION,
    "valuation" DOUBLE PRECISION,
    "valuationDate" TEXT,
    "licenses" JSONB,
    "hospitalType" TEXT,
    "ownership" TEXT,
    "yearEstablished" INTEGER,
    "bedCapacity" INTEGER,
    "emergency" BOOLEAN,
    "city" TEXT,
    "address" TEXT,
    "services" JSONB,
    "accreditation" JSONB,
    "accreditationBody" TEXT,
    "facilityBody" TEXT,
    "facilityNo" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CompanyFeatures" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CompanyFeatures_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Industry_slug_key" ON "Industry"("slug");

-- CreateIndex
CREATE INDEX "Industry_parentId_idx" ON "Industry"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_slug_key" ON "Feature"("slug");

-- CreateIndex
CREATE INDEX "Feature_industryId_idx" ON "Feature"("industryId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_slug_key" ON "Region"("slug");

-- CreateIndex
CREATE INDEX "CompanyRegion_regionId_idx" ON "CompanyRegion"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyRegion_companyId_regionId_key" ON "CompanyRegion"("companyId", "regionId");

-- CreateIndex
CREATE UNIQUE INDEX "Investor_slug_key" ON "Investor"("slug");

-- CreateIndex
CREATE INDEX "CompanyInvestor_investorId_idx" ON "CompanyInvestor"("investorId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyInvestor_companyId_investorId_fundingRoundId_key" ON "CompanyInvestor"("companyId", "investorId", "fundingRoundId");

-- CreateIndex
CREATE INDEX "FundingRound_companyId_idx" ON "FundingRound"("companyId");

-- CreateIndex
CREATE INDEX "Person_companyId_idx" ON "Person"("companyId");

-- CreateIndex
CREATE INDEX "Review_companyId_idx" ON "Review"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_industryId_idx" ON "Company"("industryId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "_CompanyFeatures_B_index" ON "_CompanyFeatures"("B");

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRegion" ADD CONSTRAINT "CompanyRegion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRegion" ADD CONSTRAINT "CompanyRegion_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInvestor" ADD CONSTRAINT "CompanyInvestor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInvestor" ADD CONSTRAINT "CompanyInvestor_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInvestor" ADD CONSTRAINT "CompanyInvestor_fundingRoundId_fkey" FOREIGN KEY ("fundingRoundId") REFERENCES "FundingRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingRound" ADD CONSTRAINT "FundingRound_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyFeatures" ADD CONSTRAINT "_CompanyFeatures_A_fkey" FOREIGN KEY ("A") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyFeatures" ADD CONSTRAINT "_CompanyFeatures_B_fkey" FOREIGN KEY ("B") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
