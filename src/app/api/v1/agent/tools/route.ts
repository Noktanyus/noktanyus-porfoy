/**
 * GET /api/v1/agent/tools — OpenAPI-derived MCP-style tool catalog (no SDK).
 * Query: ?safe=1 — only read-only meta tools (health, docs index, llms.txt)
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildAgentToolsCatalog, buildSafeAgentTools } from '@/lib/agentTools';
import { getBaseUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl();
  const safeOnly = req.nextUrl.searchParams.get('safe') === '1';

  if (safeOnly) {
    const tools = buildSafeAgentTools();
    return NextResponse.json(
      {
        protocol: 'noktanyus.agent-tools/1',
        base_url: baseUrl,
        safe_only: true,
        tools,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  }

  const catalog = buildAgentToolsCatalog(baseUrl);
  return NextResponse.json(catalog, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
