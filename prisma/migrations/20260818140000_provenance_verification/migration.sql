-- Field-level evidence gains verification (spec sections 13, 14, 29).
--
-- FieldProvenance already recorded value + source + URL + confidence. What it
-- could not express was whether a human had actually confirmed any of it —
-- the distinction section 29 says the product's credibility rests on.
--
-- Apply with `npx prisma migrate deploy` against the DIRECT Neon endpoint
-- (non "-pooler" host); the pooled one times out with P1002.

ALTER TABLE "FieldProvenance" ADD COLUMN "verifiedById" TEXT;
ALTER TABLE "FieldProvenance" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "FieldProvenance" ADD COLUMN "note" TEXT;
ALTER TABLE "FieldProvenance" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- SET NULL, not CASCADE: removing an admin must not delete the evidence they
-- checked, only the attribution.
ALTER TABLE "FieldProvenance" ADD CONSTRAINT "FieldProvenance_verifiedById_fkey"
    FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "FieldProvenance_verifiedById_idx" ON "FieldProvenance"("verifiedById");
