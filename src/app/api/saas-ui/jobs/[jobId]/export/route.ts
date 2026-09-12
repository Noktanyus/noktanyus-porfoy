/**
 * @file /api/saas-ui/jobs/[jobId]/export - Session-based CSV export.
 * @description Session-bridged job export. Workspace üyeliği zorunlu.
 *              Yanıt: JSON { csvUrl, expiresAt } veya text/csv stream.
 *
 *              Auth: getServerSession
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiBulkService } from '@/modules/ai-bulk/service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Giriş gerekli' } },
      { status: 401 }
    );
  }

  const userId = session.user.id as string;
  const jobId = params.jobId;

  // Workspace sahiplik kontrolü
  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
    select: { workspaceId: true },
  });
  if (!job) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Job bulunamadı' } },
      { status: 404 }
    );
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId: job.workspaceId },
    select: { id: true },
  });
  if (!membership) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Bu workspace\'e erişim yok' } },
      { status: 403 }
    );
  }

  try {
    const csvUrl = await aiBulkService.exportResultsCsv(jobId);
    logger.info('[saas-ui/jobs/export] CSV exported', { userId, jobId, csvUrl });
    return NextResponse.json({
      success: true,
      data: { jobId, csvUrl, expiresAt: null },
    });
  } catch (err) {
    logger.error('[saas-ui/jobs/export] failed', { error: err, userId, jobId });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: err instanceof Error ? err.message : 'CSV export başarısız',
        },
      },
      { status: 500 }
    );
  }
}
