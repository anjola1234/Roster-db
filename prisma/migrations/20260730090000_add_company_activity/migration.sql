-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "lifecycleStatus" TEXT NOT NULL DEFAULT 'unverified',
ADD COLUMN     "activityScore" INTEGER,
ADD COLUMN     "activityLabel" TEXT,
ADD COLUMN     "activityScorePrev" INTEGER,
ADD COLUMN     "websiteStatus" TEXT,
ADD COLUMN     "websiteLastCheckedAt" TIMESTAMP(3),
ADD COLUMN     "websiteLastChangedAt" TIMESTAMP(3),
ADD COLUMN     "websiteContentHash" TEXT,
ADD COLUMN     "socialStatus" TEXT NOT NULL DEFAULT 'not_monitored',
ADD COLUMN     "socialLastPostAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ActivityCheck" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "detail" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityCheck_companyId_checkedAt_idx" ON "ActivityCheck"("companyId", "checkedAt");

-- AddForeignKey
ALTER TABLE "ActivityCheck" ADD CONSTRAINT "ActivityCheck_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
