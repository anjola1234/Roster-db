import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "@/lib/session";

/**
 * Authorization for everything under /admin and /api/admin.
 *
 * Deliberately enforced here — in each page/route handler — rather than in a
 * `proxy.ts` (the Next 16 replacement for middleware). The role check needs a
 * database lookup to resolve the session cookie, and a proxy runs before and
 * outside the request's normal server context, so a proxy-only guard would
 * either duplicate that lookup or be trivially stale. Guarding at the point of
 * use means no admin page or endpoint can be reached without a real, live
 * check against the Session + User tables.
 */

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "admin";
}

/** For server components under /admin. Redirects instead of rendering. */
export async function requireAdminPage(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  // Signed in but not an admin: 404 rather than 403, so the existence of the
  // dashboard isn't confirmed to a curious logged-in user.
  if (!isAdmin(user)) redirect("/");
  return user;
}

export type AdminGuardResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

/**
 * For route handlers under /api/admin. Returns the admin user or a ready-made
 * error response — call sites must check `ok` before proceeding.
 */
export async function requireAdminApi(): Promise<AdminGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sign in required." }, { status: 401 }),
    };
  }
  if (!isAdmin(user)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin access required." }, { status: 403 }),
    };
  }
  return { ok: true, user };
}
