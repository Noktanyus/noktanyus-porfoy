import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'fail'; latency?: number; error?: string }> = {};
  const startTime = Date.now();

  // Database check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latency: Date.now() - dbStart };
  } catch (err) {
    checks.database = {
      status: 'fail',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }

  // System status
  const allOk = Object.values(checks).every((c) => c.status === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      totalLatency: Date.now() - startTime,
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
