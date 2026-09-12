import { defineConfig } from "drizzle-kit";

// drizzle-kit does not load .env files itself; Node 22 can.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local (e.g. on Vercel) — DATABASE_URL must already be in the environment
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
