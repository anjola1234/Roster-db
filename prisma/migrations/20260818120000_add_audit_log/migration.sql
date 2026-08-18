-- Append-only admin action log (product spec sections 12 and 26).
--
-- Hand-authored, matching the convention of the other migrations in this
-- folder. Apply with `npx prisma migrate deploy` against the DIRECT Neon
-- endpoint (the non "-pooler" host) — the pooled endpoint cannot hold the
-- advisory lock the migration engine takes, and times out with P1002.

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "targetLabel" TEXT NOT NULL,
    "changes" JSONB,
    "summary" TEXT,
    "reason" TEXT,
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- ON DELETE SET NULL, not CASCADE: removing an admin account must not erase
-- the record of what they did. actorEmail keeps the trail readable afterwards.
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
