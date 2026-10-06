
/**
 * MVP mode: authentication is bypassed and all requests use the
 * existing household ID.
 *
 * WARNING: Keep this configuration local for testing. Do not deploy
 * publicly without restoring appropriate access controls.
 */
import { cache } from "react";

const MVP_HOUSEHOLD_ID = "f39adff3-11dd-4263-b28a-6ad9e72326c3";

/** Authentication is disabled for MVP testing. */
export const getSession = cache(async () => null);

/** Return the fixed MVP household without requiring a signed-in user. */
export async function requireUser() {
  throw new Error(
    "Authentication is disabled in MVP mode. Do not call requireUser().",
  );
}

/** Return the existing household ID without redirecting to /login. */
export const requireHousehold = cache(async (): Promise<string> => {
  return MVP_HOUSEHOLD_ID;
});

/** Return the fixed household ID without requiring a session. */
export async function householdForCurrentUser(): Promise<string | null> {
  return MVP_HOUSEHOLD_ID;
}
