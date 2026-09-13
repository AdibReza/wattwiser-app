import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/**
 * The nine tables of the published data contract (docs/specs/data-contract.md).
 * Better Auth's own tables are deliberately not listed: this endpoint is public,
 * and the deploy check is "did the contract migrate?", not "what else is here?".
 */
const CONTRACT_TABLES = [
  "appliance_signatures",
  "appliances",
  "calibration_sessions",
  "devices",
  "event_confirmations",
  "events",
  "household",
  "mock_switches",
  "readings",
];

/**
 * GET /api/health → { ok, tables: [...] } — which contract tables the database
 * actually has. The one route that stays public: it is how a deploy is verified,
 * and it exposes no data, only whether the migrations ran.
 */
export async function GET() {
  try {
    const rows = await getDb().execute<{ table_name: string }>(sql`
      select table_name from information_schema.tables
      where table_schema = 'public' order by table_name
    `);
    const present = new Set(rows.map((r) => r.table_name));
    const tables = CONTRACT_TABLES.filter((t) => present.has(t));
    const missing = CONTRACT_TABLES.filter((t) => !present.has(t));
    return NextResponse.json({ ok: missing.length === 0, tables, missing });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database unreachable";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
