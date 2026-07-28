import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import { createSession } from "@/lib/session";
import { rateLimit, clientIpFrom } from "@/lib/rateLimit";

const BCRYPT_COST = 12;

export async function POST(request: NextRequest) {
  const ip = clientIpFrom(request);
  const limited = rateLimit(`signup:${ip}`, { limit: 8, windowMs: 15 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  await createSession(user.id);

  return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
}
