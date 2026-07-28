import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST(request: Request) {
  await clearSession();
  // The nav's logout form is a plain HTML POST (no JS), so redirect back home.
  const url = new URL("/", request.url);
  return NextResponse.redirect(url, { status: 303 });
}
