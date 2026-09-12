import { defineConfig } from "drizzle-kit";
import { assertAllowedDatabaseTarget } from "./lib/db/target";

// drizzle-kit does not load .env files itself; Node 22 can.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local (e.g. on Vercel) — DATABASE_URL must already be in the environment
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
assertAllowedDatabaseTarget(url); // local dev can only migrate the local database

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
});
