import { NextResponse } from "next/server";
import { getEcosystemStats } from "@/lib/queries";

export async function GET() {
  const stats = await getEcosystemStats();
  return NextResponse.json(stats);
}
