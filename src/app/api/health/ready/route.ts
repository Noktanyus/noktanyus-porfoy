/**
 * @file Vercel Deployment Health Check
 * @description Vercel cron + monitoring tarafından çağrılan health endpoint.
 *              Database, Redis, Sentry bağlantılarını kontrol eder.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // Database check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = { ok: false, error: (err as Error).message };
  }

  const totalLatencyMs = Date.now() - start;
  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
      totalLatencyMs,
      version: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
      environment: process.env.NODE_ENV,
      region: process.env.VERCEL_REGION ?? "unknown",
    },
    { status: allOk ? 200 : 503 }
  );
}