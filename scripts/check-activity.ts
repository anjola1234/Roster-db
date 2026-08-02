/**
 * Standalone CLI runner for the company activity checker — for manual
 * testing/runs against the real Prisma database. No HTTP, no auth needed
 * since this only runs locally (`npm run check-activity`).
 */
import "dotenv/config";
import { checkAllCompanies } from "../src/lib/activityCheck";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Running website activity checks against all operating/unverified companies...");
  const summary = await checkAllCompanies();
  console.log("Done:", summary);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
