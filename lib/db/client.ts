import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { assertAllowedDatabaseTarget } from "./target";

/**
 * One shared connection for the whole app, created on first use.
 *   local : DATABASE_URL points at the local Supabase (127.0.0.1:55322)
 *   Vercel: DATABASE_URL is the hosted Supabase *Transaction pooler* string (port 6543)
 * The pooler does not support prepared statements, hence `prepare: false`.
 * Never import this from a screen — only from route handlers and server-side queries.
 */
type Db = PostgresJsDatabase<typeof schema>;
const g = globalThis as unknown as { __wattwiserDb?: Db };

export function getDb(): Db {
  if (g.__wattwiserDb) return g.__wattwiserDb;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local (see docs/architecture.md §4).");
  }
  assertAllowedDatabaseTarget(url);
  const client = postgres(url, { prepare: false, max: 5 });
  g.__wattwiserDb = drizzle(client, { schema });
  return g.__wattwiserDb;
}

export { schema };
