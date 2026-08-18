-- Per-check content hash, so the website-content activity signal can look at a
-- window of checks rather than only the most recent one.
--
-- Nullable and backfill-free on purpose: existing rows genuinely have no hash,
-- and inventing one would make the signal claim knowledge it doesn't have. The
-- signal reports "not measured" until a company has two hashed checks.
--
-- Apply with `npx prisma migrate deploy` against the DIRECT Neon endpoint.

ALTER TABLE "WebsiteCheck" ADD COLUMN "contentHash" TEXT;
