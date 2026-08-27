import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface ModuleStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latency: number;
  details: Record<string, unknown>;
}

export async function GET() {
  const startTime = Date.now();
  const modules: ModuleStatus[] = [];

  // Content module
  try {
    const t = Date.now();
    await prisma.blog.count();
    await prisma.project.count();
    modules.push({
      name: 'content',
      status: 'up',
      latency: Date.now() - t,
      details: { description: 'Blog + Projects + About' },
    });
  } catch (err) {
    modules.push({
      name: 'content',
      status: 'down',
      latency: 0,
      details: { error: err instanceof Error ? err.message : 'Unknown' },
    });
  }

  // Commerce module
  try {
    const t = Date.now();
    await prisma.digitalProduct.count();
    await prisma.plan.count();
    modules.push({
      name: 'commerce',
      status: 'up',
      latency: Date.now() - t,
      details: { description: 'Plans + Products + Orders + Subscriptions' },
    });
  } catch (err) {
    modules.push({
      name: 'commerce',
      status: 'down',
      latency: 0,
      details: { error: err instanceof Error ? err.message : 'Unknown' },
    });
  }

  // Monitoring module
  try {
    const t = Date.now();
    await prisma.monitor.count();
    modules.push({
      name: 'monitoring',
      status: 'up',
      latency: Date.now() - t,
      details: { description: 'Monitors + Checks + Incidents' },
    });
  } catch (err) {
    modules.push({
      name: 'monitoring',
      status: 'down',
      latency: 0,
      details: { error: err instanceof Error ? err.message : 'Unknown' },
    });
  }

  // Messaging module
  try {
    const t = Date.now();
    await prisma.message.count();
    await prisma.newsletterSubscriber.count();
    modules.push({
      name: 'messaging',
      status: 'up',
      latency: Date.now() - t,
      details: { description: 'Contact + Newsletter' },
    });
  } catch (err) {
    modules.push({
      name: 'messaging',
      status: 'down',
      latency: 0,
      details: { error: err instanceof Error ? err.message : 'Unknown' },
    });
  }

  const allUp = modules.every((m) => m.status === 'up');
  const anyDown = modules.some((m) => m.status === 'down');

  return NextResponse.json(
    {
      status: allUp ? 'all-up' : anyDown ? 'critical' : 'degraded',
      timestamp: new Date().toISOString(),
      totalLatency: Date.now() - startTime,
      modules,
    },
    { status: allUp ? 200 : anyDown ? 503 : 207 },
  );
}
