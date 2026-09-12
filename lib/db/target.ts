/**
 * Safety guard — see docs/architecture.md §4 "Environment".
 *
 * Local development must never touch the hosted Supabase project. This function
 * is called before any connection is opened (app client and drizzle-kit alike)
 * and throws unless one of these is true:
 *   - the database host is local (127.0.0.1 / localhost / host.docker.internal), or
 *   - the code is running on Vercel (VERCEL=1, set automatically there), or
 *   - ALLOW_CLOUD_DB=true was set on purpose for a one-off.
 */
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "host.docker.internal"]);

export function isLocalDatabaseUrl(url: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function assertAllowedDatabaseTarget(url: string): void {
  if (isLocalDatabaseUrl(url)) return;
  if (process.env.VERCEL === "1") return;
  if (process.env.ALLOW_CLOUD_DB === "true") return;

  let host = "unknown host";
  try {
    host = new URL(url).hostname;
  } catch {
    // keep "unknown host"
  }
  throw new Error(
    `Refusing to connect to a non-local database (${host}) from a local environment. ` +
      `Local development uses the local Supabase instance only. ` +
      `Run "just up" and point DATABASE_URL at 127.0.0.1. ` +
      `(Override for a deliberate one-off with ALLOW_CLOUD_DB=true.)`
  );
}
