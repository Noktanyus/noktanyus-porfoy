/**
 * GET /api/user/usage/export — son N saatlik isteklerin CSV’si
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiKeyService } from '@/modules/api-keys/service';
import { fail } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const hoursParam = Number(req.nextUrl.searchParams.get('hours') ?? '168');
    const hours = Number.isFinite(hoursParam) ? hoursParam : 168;
    const overview = await apiKeyService.getUserUsageOverview(userId, hours);

    const header = 'timestamp,method,endpoint,statusCode,durationMs,apiKeyId,keyName';
    const lines = overview.recent.map((r) =>
      [
        r.timestamp.toISOString(),
        r.method,
        r.endpoint,
        String(r.statusCode),
        r.durationMs != null ? String(r.durationMs) : '',
        r.apiKeyId,
        r.keyName ?? '',
      ]
        .map(csvEscape)
        .join(',')
    );

    const body = [header, ...lines].join('\n');
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="noktanyus-usage-${hours}h.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return fail(err);
  }
}
