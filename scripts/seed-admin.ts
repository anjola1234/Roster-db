/**
 * Creates (or resets) an admin account so you can log straight in.
 *
 *   npm run seed-admin
 *
 * Defaults to admin@indexone.test / indexone-admin-2026 unless ADMIN_EMAIL
 * and ADMIN_PASSWORD are set, in which case those are used instead.
 *
 * WHY THIS REFUSES TO RUN IN PRODUCTION
 * -------------------------------------
 * The default credentials are written down in this file, in the README, and
 * in the repo's history — so they are public. IndexOne is a public directory
 * deployed to Vercel; a known email and password with full moderation rights
 * would let anyone edit, publish or delete every listing in the database.
 *
 * So: if NODE_ENV is "production", this script will not create the default
 * account. You can still use it there, but only by supplying your own
 * ADMIN_EMAIL and ADMIN_PASSWORD, which keeps the credential out of the
 * codebase. For a real production admin, prefer signing up through the app
 * and running `npm run make-admin -- you@example.com`.
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DEFAULT_EMAIL = "admin@indexone.test";
const DEFAULT_PASSWORD = "indexone-admin-2026";
const BCRYPT_COST = 12;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to .env first.");
    process.exit(1);
  }

  const isProduction = process.env.NODE_ENV === "production";
  const email = (process.env.ADMIN_EMAIL ?? DEFAULT_EMAIL).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
  const usingDefaults = !process.env.ADMIN_EMAIL && !process.env.ADMIN_PASSWORD;

  if (isProduction && usingDefaults) {
    console.error(
      [
        "Refusing to create the demo admin in production.",
        "",
        "The default credentials are published in this repo, so creating this",
        "account on a live deployment would hand full moderation rights to",
        "anyone who reads the source.",
        "",
        "Either set your own ADMIN_EMAIL and ADMIN_PASSWORD and re-run, or",
        "sign up through the app and run:",
        "    npm run make-admin -- you@example.com",
      ].join("\n"),
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    // Upsert so re-running is a password reset rather than an error — handy
    // when someone on the team forgets what the demo password was.
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: "admin" },
      create: { email, name: "IndexOne Admin", passwordHash, role: "admin" },
    });

    console.log("\nAdmin account ready.\n");
    console.log(`  Email:    ${user.email}`);
    console.log(`  Password: ${usingDefaults ? DEFAULT_PASSWORD : "(the ADMIN_PASSWORD you set)"}`);
    console.log("\nLog in at /login, then use the Admin link in the nav.\n");

    if (usingDefaults) {
      console.log("These credentials are public. Do not use them on a real deployment.\n");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
