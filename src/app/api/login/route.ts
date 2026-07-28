import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { createSession } from "@/lib/session";
import { rateLimit, clientIpFrom } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = clientIpFrom(request);
  const limited = rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  // Generic error message on both "no such user" and "wrong password" so we
  // don't leak which emails are registered.
  const genericError = () => NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return genericError();

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return genericError();

  await createSession(user.id);
  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
