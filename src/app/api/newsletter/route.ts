import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validation";
import { rateLimit, clientIpFrom } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = clientIpFrom(request);
  const limited = rateLimit(`newsletter:${ip}`, { limit: 6, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  // Upsert so re-subscribing is idempotent; the response is identical either
  // way so this endpoint can't be used to enumerate registered emails.
  await prisma.newsletterSubscriber
    .upsert({
      where: { email: parsed.data.email },
      update: {},
      create: { email: parsed.data.email },
    })
    .catch(() => {});

  return NextResponse.json({ message: "Subscribed." });
}
