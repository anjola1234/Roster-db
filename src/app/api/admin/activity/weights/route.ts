import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { scoreWeightsSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { SIGNAL_DEFINITIONS, WEIGHTS_VERSION, loadWeights } from "@/lib/activitySignals";

/** Saves admin-configured signal weights (spec §4: "configurable from the admin panel"). */
export async function PUT(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = scoreWeightsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Weights must be numbers between 0 and 1." }, { status: 400 });
  }

  const known = new Set(SIGNAL_DEFINITIONS.map((d) => d.key));
  const entries = Object.entries(parsed.data.weights).filter(([k]) => known.has(k as never));
  if (!entries.length) {
    return NextResponse.json({ error: "No recognised signals in that payload." }, { status: 400 });
  }

  const before = await loadWeights();
  const now = new Date();

  await prisma.$transaction(
    entries.map(([component, weight]) =>
      prisma.scoreWeight.upsert({
        where: {
          version_scoreType_component: { version: WEIGHTS_VERSION, scoreType: "activity", component },
        },
        update: { weight, effectiveFrom: now },
        create: {
          version: WEIGHTS_VERSION,
          scoreType: "activity",
          component,
          weight,
          effectiveFrom: now,
        },
      }),
    ),
  );

  await recordAudit({
    actor: guard.user,
    action: "weights.update",
    entityType: "ScoreWeight",
    entityId: WEIGHTS_VERSION,
    targetLabel: "Activity score weights",
    changes: entries
      .filter(([k, v]) => before[k as keyof typeof before] !== v)
      .map(([field, to]) => ({ field, from: before[field as keyof typeof before], to })),
    summary:
      "Existing scores are unchanged until each listing is re-checked — weights apply at computation time, not retroactively.",
  });

  return NextResponse.json({ saved: entries.length });
}
