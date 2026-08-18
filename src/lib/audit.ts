import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/session";

/**
 * Writes the audit trail described in sections 12 and 26 of the product spec.
 *
 * Two rules shape everything here:
 *
 * 1. **Logging must never break the action.** If the log write fails, the
 *    company still gets approved and the admin still sees success. A failed
 *    audit write is reported to the server console, not to the user, and never
 *    rolls back the thing being audited. The alternative — an admin unable to
 *    moderate because a logging table is unhappy — is worse than a gap in the
 *    log, and the gap is visible either way.
 *
 * 2. **Snapshot, don't join.** actorEmail and targetLabel are copied in at
 *    write time. A log that renders "unknown → unknown" after the company is
 *    deleted would be useless precisely when it matters most.
 */

export type FieldChange = { field: string; from: unknown; to: unknown };

export type AuditInput = {
  actor: SessionUser;
  action: string;
  entityType: string;
  entityId: string;
  targetLabel: string;
  changes?: FieldChange[];
  summary?: string;
  reason?: string | null;
  evidence?: unknown;
};

/** Values we never write to the log, whatever happens. */
const REDACTED_FIELDS = new Set(["passwordHash", "password", "sessionToken"]);

/** Long text is truncated — the log records that a field changed, not a novel. */
const MAX_VALUE_LENGTH = 300;

function normalise(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.slice(0, 20);
  if (typeof value === "string" && value.length > MAX_VALUE_LENGTH) {
    return `${value.slice(0, MAX_VALUE_LENGTH)}… (${value.length} chars)`;
  }
  return value;
}

/**
 * Compares two records and returns only what actually changed. Keys absent
 * from `after` are ignored, so a partial update doesn't read as clearing every
 * field it didn't send.
 */
export function diffRecords(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of Object.keys(after)) {
    if (REDACTED_FIELDS.has(field)) continue;
    const from = normalise(before[field]);
    const to = normalise(after[field]);
    // JSON compare so arrays and objects (licenses, services, socials) diff
    // by value rather than by reference.
    if (JSON.stringify(from) === JSON.stringify(to)) continue;
    changes.push({ field, from, to });
  }
  return changes;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorEmail: input.actor.email,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        targetLabel: input.targetLabel,
        changes: (input.changes?.length
          ? (input.changes as unknown as Prisma.InputJsonValue)
          : undefined) as Prisma.InputJsonValue | undefined,
        summary: input.summary ?? null,
        reason: input.reason?.trim() || null,
        evidence: (input.evidence as Prisma.InputJsonValue) ?? undefined,
      },
    });
  } catch (err) {
    // Deliberately swallowed — see rule 1 above.
    console.error("[audit] failed to record action", input.action, err);
  }
}

/** Human-readable labels for the actions the dashboard emits. */
export const ACTION_LABELS: Record<string, string> = {
  "company.create": "Created listing",
  "company.update": "Edited listing",
  "company.delete": "Deleted listing",
  "company.import": "Bulk imported listings",
  "company.approve": "Approved submission",
  "company.reject": "Rejected submission",
  "company.verify": "Marked verified",
  "company.unverify": "Removed verification",
  "company.flag": "Flagged for review",
  "company.archive": "Archived listing",
  "company.restore": "Restored listing",
  "review.publish": "Published review",
  "review.reject": "Rejected review",
  "review.remove": "Removed review",
  "review.unpublish": "Unpublished review",
  "claim.approve": "Approved ownership claim",
  "claim.reject": "Rejected ownership claim",
  "claim.revoke": "Revoked ownership claim",
  "activity.check": "Ran website activity check",
  "evidence.add": "Attached evidence",
  "evidence.verify": "Verified a field",
  "evidence.unverify": "Withdrew field verification",
  "evidence.set-winning": "Changed authoritative source",
  "evidence.delete": "Removed evidence",
};

export function labelForAction(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

/** Actions grouped for the audit page's filter dropdown. */
export const ACTION_GROUPS: Record<string, string[]> = {
  Listings: [
    "company.create",
    "company.update",
    "company.delete",
    "company.import",
    "company.approve",
    "company.reject",
    "company.verify",
    "company.unverify",
    "company.flag",
    "company.archive",
    "company.restore",
  ],
  Reviews: ["review.publish", "review.reject", "review.remove", "review.unpublish"],
  Claims: ["claim.approve", "claim.reject", "claim.revoke"],
  Activity: ["activity.check"],
  Evidence: [
    "evidence.add",
    "evidence.verify",
    "evidence.unverify",
    "evidence.set-winning",
    "evidence.delete",
  ],
};
