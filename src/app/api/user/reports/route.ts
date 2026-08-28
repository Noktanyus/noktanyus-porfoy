/**
 * /api/user/reports
 *   GET  — Kullanicinin olusturdugu raporleri listele.
 *   POST — Yeni rapor olustur.
 *
 * Phase: G3 Custom Report Builder
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { reportService } from '@/modules/reports';

export const dynamic = 'force-dynamic';

const CreateReportSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  reportType: z.enum(['orders', 'users', 'monitors', 'revenue']),
  config: z.record(z.any()).default({}),
  schedule: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recipients: z.array(z.string().email()).optional(),
  format: z.enum(['table', 'bar', 'line', 'pie']).default('table'),
});

export async function GET(_req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    const reports = await reportService.list(userId);
    return ok({ reports });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    const body = await req.json().catch(() => ({}));
    const data = CreateReportSchema.parse(body);

    const report = await reportService.create(userId, data);
    return ok({ report }, { status: 201 });
  });
}