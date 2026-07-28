import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires an explicit driver adapter for direct DB connections —
// the datasource URL is no longer read from schema.prisma at runtime.
// Postgres (not SQLite) because this app is deployed to Vercel: serverless
// functions there have a read-only filesystem and don't persist a local
// SQLite file between invocations, so a networked database is required.
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Provision a Postgres database (e.g. Vercel Postgres/Neon) and set DATABASE_URL in .env locally and in your Vercel project's environment variables."
  );
}
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
