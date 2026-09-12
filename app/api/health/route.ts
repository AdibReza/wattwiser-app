import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/** GET /api/health → { ok, tables: [...] }  — lists the contract tables the DB actually has. */
export async function GET() {
  try {
    const rows = await getDb().execute<{ table_name: string }>(sql`
      select table_name from information_schema.tables
      where table_schema = 'public' order by table_name
    `);
    const tables = rows.map((r) => r.table_name).filter((t) => t !== "__drizzle_migrations");
    return NextResponse.json({ ok: true, tables });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database unreachable";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
