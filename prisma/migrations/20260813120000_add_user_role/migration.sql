-- Adds User.role, the single schema change required by the admin dashboard.
--
-- Hand-authored (same convention as the earlier migrations in this folder):
-- NOT run against a live database, because no working DATABASE_URL exists on
-- the machine this was written on. Run `npx prisma migrate deploy` against the
-- real Neon database, then grant yourself access with:
--     npm run make-admin -- you@example.com
--
-- Every existing account keeps role='user'; there are deliberately zero admins
-- until someone is promoted explicitly.

ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
