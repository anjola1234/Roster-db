/**
 * Grants (or revokes) admin access.
 *
 *   npm run make-admin -- someone@example.com
 *   npm run make-admin -- someone@example.com --revoke
 *
 * Deliberately a CLI script rather than anything in the app: there is no
 * in-product way to create the first admin, and no HTTP endpoint anywhere
 * writes User.role. Whoever holds the database credentials grants access.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();
  const revoke = args.includes("--revoke");

  if (!email) {
    console.error("Usage: npm run make-admin -- <email> [--revoke]");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to .env first.");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`No account found for ${email}. They need to sign up first.`);
      process.exit(1);
    }

    const role = revoke ? "user" : "admin";
    if (user.role === role) {
      console.log(`${email} is already role="${role}". Nothing to do.`);
      return;
    }

    await prisma.user.update({ where: { email }, data: { role } });
    console.log(`${email}: role "${user.role}" -> "${role}".`);
    if (!revoke) console.log("They'll see an Admin link in the nav on their next page load.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
