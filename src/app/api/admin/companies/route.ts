import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { adminCompanySchema } from "@/lib/validation";
import { createCompany, resolveTaxonomy } from "@/lib/companyWrite";

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = adminCompanySchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Invalid input.", field: issue?.path.join(".") },
      { status: 400 },
    );
  }

  const taxonomy = await resolveTaxonomy(parsed.data);
  if ("error" in taxonomy) {
    return NextResponse.json({ error: taxonomy.error }, { status: 400 });
  }

  const result = await createCompany(parsed.data, taxonomy.refs);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    { id: result.company.id, slug: result.company.slug },
    { status: 201 },
  );
}
