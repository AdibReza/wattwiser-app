/**
 * The two guards every protected thing goes through.
 *
 *   server components / layouts → requireHousehold()   redirects to /login
 *   route handlers              → see requireApiHousehold() in lib/api.ts, 401
 *
 * Both read the same request-cached session, so a layout and the page inside it
 * cost one session lookup between them, not two.
 */
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { claimOrCreateHousehold, householdIdForUser } from "@/lib/db/queries/household";

/** The signed-in session, or null. Cached for the lifetime of one request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** The signed-in user, or a redirect to /login. Server components only. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}

/**
 * Which household belongs to which account.
 *
 * Safe to remember for the life of the process: `household.user_id` is unique
 * and is set once, in the sign-up hook. An account's household id never changes,
 * so there is no stale value to worry about — only a cold start, which costs the
 * one query again. Without this, every request pays a lookup that can never
 * return a different answer.
 *
 * Only successful lookups are kept, so a half-finished sign-up is retried.
 *
 * One dev-only trap: `just db-reset` while `pnpm dev` is running wipes the
 * households but not this Map, so screens go quiet until the server restarts.
 * Deleting an account in production cascades its session too, so the stale id
 * is unreachable there.
 */
const householdIdByUser = new Map<string, string>();

async function resolveHousehold(userId: string): Promise<string> {
  const known = householdIdByUser.get(userId);
  if (known) return known;

  // The sign-up hook already made the household; the fallback only fires if that
  // ever failed — better to create one than to hand back a broken screen.
  const id = (await householdIdForUser(userId)) ?? (await claimOrCreateHousehold(userId));
  householdIdByUser.set(userId, id);
  return id;
}

/** The caller's household id, or a redirect to /login. Server components only. */
export const requireHousehold = cache(async (): Promise<string> => {
  const user = await requireUser();
  return resolveHousehold(user.id);
});

/** Same lookup without the redirect — for route handlers, which return 401 instead. */
export async function householdForCurrentUser(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  return resolveHousehold(session.user.id);
}
