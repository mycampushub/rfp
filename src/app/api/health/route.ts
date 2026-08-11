import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const checks: Record<string, { status: 'up' | 'down'; latency?: number }> = {};

  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = { status: 'up', latency: Date.now() - start };
  } catch {
    checks.database = { status: 'down' };
  }

  const allUp = Object.values(checks).every((c) => c.status === 'up');
  return NextResponse.json(
    {
      status: allUp ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allUp ? 200 : 503 },
  );
}
