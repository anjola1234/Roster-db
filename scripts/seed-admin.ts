/**
 * Creates or updates an admin account so someone can log straight into /admin.
 *
 *   npm run seed-admin
 *
 * SAFE TO PUT IN THE VERCEL BUILD COMMAND. It is idempotent (re-running just
 * re-applies the same credentials) and it never fails a build: if it has
 * nothing to do, it logs why and exits 0.
 *
 * WHERE THE CREDENTIALS COME FROM
 * -------------------------------
 * Production (NODE_ENV=production, which is what Vercel sets):
 *   ADMIN_EMAIL and ADMIN_PASSWORD must both be set as environment variables.
 *   Set them in the Vercel dashboard, not in this repo — that keeps the
 *   password out of the source, out of git history, and out of reach of
 *   anyone reading the code. If they aren't set, this script does nothing.
 *
 * Local development:
 *   Falls back to admin@indexone.test / indexone-admin-2026 so you can get
 *   going with one command. Those defaults are published in this file, so
 *   they are deliberately never used in production.
 *
 * A NOTE ON RISK, WORTH READING ONCE
 * ----------------------------------
 * An admin can edit, publish and delete every listing in the directory. While
 * this account exists on a deployed site, anyone holding the password has
 * that power. For a QA pass that's a reasonable trade — just use a password
 * you don't use anywhere else, and when testing is done either rotate it or
 * revoke the account entirely:
 *
 *     DATABASE_URL="<prod url>" npm run make-admin -- qa@yourcompany.com --revoke
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DEFAULT_EMAIL = "admin@indexone.test";
const DEFAULT_PASSWORD = "indexone-admin-2026";
const BCRYPT_COST = 12;
const MIN_PASSWORD_LENGTH = 12;

/** Exits 0 — this script must never be the reason a deploy goes red. */
function skip(reason: string, detail?: string[]) {
  console.log(`\n[seed-admin] Skipped: ${reason}`);
  if (detail) detail.forEach((line) => console.log(`[seed-admin] ${line}`));
  console.log("");
  process.exit(0);
}

async function main() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!process.env.DATABASE_URL) {
    skip("DATABASE_URL is not set.", ["Nothing was written. Add it to .env (local) or your Vercel environment variables."]);
  }

  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD;
  const hasEnvCredentials = Boolean(envEmail && envPassword);

  if (isProduction && !hasEnvCredentials) {
    skip("no ADMIN_EMAIL / ADMIN_PASSWORD set in a production environment.", [
      "The built-in demo credentials are published in this repo, so they are",
      "never created on a deployed site.",
      "",
      "To give QA access: set ADMIN_EMAIL and ADMIN_PASSWORD in your Vercel",
      "project settings (Settings -> Environment Variables), then redeploy.",
    ]);
  }

  const email = envEmail ?? DEFAULT_EMAIL;
  const password = envPassword ?? DEFAULT_PASSWORD;

  // Only enforced on credentials someone chose; the local default is exempt
  // because it's a known throwaway, not a secret.
  if (hasEnvCredentials && password.length < MIN_PASSWORD_LENGTH) {
    skip(`ADMIN_PASSWORD is shorter than ${MIN_PASSWORD_LENGTH} characters.`, [
      "No account was created. Use a longer password — this one guards write",
      "access to every listing in the directory.",
    ]);
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    skip(`ADMIN_EMAIL ("${email}") is not a valid email address.`);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: "admin" },
      create: { email, name: "IndexOne Admin", passwordHash, role: "admin" },
    });

    console.log(`\n[seed-admin] Admin ${existing ? "updated" : "created"}: ${user.email}`);
    if (hasEnvCredentials) {
      // Never print a real password to build logs — Vercel keeps those, and
      // anyone with repo access can read them.
      console.log("[seed-admin] Password taken from ADMIN_PASSWORD (not logged).");
    } else {
      console.log(`[seed-admin] Password: ${DEFAULT_PASSWORD}  (local dev default — public, do not deploy)`);
    }
    console.log("[seed-admin] Log in at /login, then use the Admin link in the nav.\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // Even a genuine failure shouldn't take the build down: the app itself is
  // fine without this account, and a red deploy is the worse outcome.
  console.error("\n[seed-admin] Failed to seed the admin account:", err instanceof Error ? err.message : err);
  console.error("[seed-admin] Continuing anyway — the deploy is unaffected.\n");
  process.exit(0);
});
