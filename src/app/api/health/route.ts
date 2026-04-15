import { getDb } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // Check env vars (names only, not values)
  checks.env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "(not set)",
    VERCEL_URL: process.env.VERCEL_URL || "(not set)",
    VERCEL_PROJECT_PRODUCTION_URL:
      process.env.VERCEL_PROJECT_PRODUCTION_URL || "(not set)",
  };

  // Check DB connection
  try {
    const db = getDb();
    const result = await db.execute(sql`SELECT 1 as ok`);
    checks.db = { connected: true };
  } catch (error) {
    checks.db = {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Check if auth tables exist
  try {
    const db = getDb();
    const result = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    checks.tables = result.rows.map((r: Record<string, unknown>) => r.table_name);
  } catch (error) {
    checks.tables = {
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return Response.json(checks, { status: 200 });
}
