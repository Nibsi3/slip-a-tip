import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const checks: Record<string, string> = {
    server: "ok",
    database_url_set: process.env.DATABASE_URL ? "yes" : "NO - MISSING",
    direct_url_set: process.env.DIRECT_URL ? "yes" : "NO - MISSING",
    jwt_secret_set: process.env.JWT_SECRET ? "yes" : "NO - using default",
  };

  try {
    const result = await db.$queryRaw`SELECT 1 as ok`;
    checks.database = "connected";
    checks.db_result = JSON.stringify(result);
  } catch (err: unknown) {
    checks.database = "FAILED";
    checks.db_error = err instanceof Error ? err.message : String(err);
  }

  try {
    const userCount = await db.user.count();
    checks.user_count = String(userCount);
  } catch (err: unknown) {
    checks.user_count_error = err instanceof Error ? err.message : String(err);
  }

  const allOk = checks.database === "connected" && checks.database_url_set === "yes";

  return NextResponse.json(checks, { status: allOk ? 200 : 500 });
}
