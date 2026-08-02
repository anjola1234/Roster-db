import { NextRequest, NextResponse } from "next/server";
import { checkAllCompanies } from "@/lib/activityCheck";

// Triggered by Vercel Cron (see vercel.json). Vercel automatically sends the
// `authorization: Bearer ${CRON_SECRET}` header on cron-triggered requests
// once CRON_SECRET is set as a project env var — this is a documented Vercel
// Cron Jobs feature, no extra wiring needed beyond setting that env var.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await checkAllCompanies();
  return NextResponse.json(summary);
}
