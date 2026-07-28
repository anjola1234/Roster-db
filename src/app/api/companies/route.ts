import { NextRequest, NextResponse } from "next/server";
import { getCompanies, sortCompanies } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const vertical = sp.get("vertical") ?? undefined;
  const industry = sp.get("industry") ?? undefined;
  const region = sp.get("region") ?? undefined;
  const status = sp.get("status") ?? undefined;
  const q = sp.get("q") ?? undefined;
  const tagsParam = sp.get("tags");
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined;
  const sort = sp.get("sort") ?? undefined;

  const limitParam = sp.get("limit");
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 0), 200) : undefined;

  const rows = await getCompanies({ vertical, industry, region, status, tags, q });
  const sorted = sortCompanies(rows, sort);
  const page = limit ? sorted.slice(0, limit) : sorted;

  return NextResponse.json({ companies: page, total: sorted.length });
}
