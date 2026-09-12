/**
 * @file /api/compliance/sites/[id]/report.pdf - Compliance Audit Report PDF
 * @description GET: ComplianceSite için en son completed scan'in PDF audit
 *              raporunu üretir ve application/pdf olarak döner.
 *
 * Auth: authenticated user + workspace membership.
 * Query:
 *   - workspaceId (required)
 *   - scanId? (opsiyonel — verilirse o scan'in raporu, yoksa latest completed)
 * Response: application/pdf binary
 *
 * NOT: @react-pdf/renderer yüklü değilse graceful HTML fallback döner
 * (Content-Type: text/html). Bu sayede build/runtime hatası yüzünden 500
 * almak yerine kullanıcı veriyi en azından okuyabilir.
 */

import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { UnauthorizedError, ValidationError } from '@/modules/shared/errors';
import { assertWorkspaceAccess } from '@/lib/saasWorkspace';
import { extractWorkspaceId } from '@/lib/saasWorkspace';
import {
  generateAuditReport,
  generateSiteAuditReport,
} from '@/modules/compliance/pdfExport';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }

    const params = await Promise.resolve(context.params);
    const siteId = params.id;
    if (!siteId) {
      throw new ValidationError('Site ID zorunlu');
    }

    const workspaceId = extractWorkspaceId(req);
    if (!workspaceId) {
      throw new ValidationError('workspaceId gerekli (?workspaceId=...)');
    }

    const wsCheck = await assertWorkspaceAccess(req, session.user.id);
    if (wsCheck.error) return wsCheck.error;

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      undefined;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    const requestedScanId = req.nextUrl.searchParams.get('scanId');

    let result;
    if (requestedScanId) {
      result = await generateAuditReport({
        scanId: requestedScanId,
        workspaceId,
        userId: session.user.id,
        userEmail: session.user.email ?? undefined,
        ipAddress,
        userAgent,
      });
    } else {
      result = await generateSiteAuditReport({
        siteId,
        workspaceId,
        userId: session.user.id,
        userEmail: session.user.email ?? undefined,
        ipAddress,
        userAgent,
      });
    }

    // @react-pdf/renderer yüklü değilse fallback HTML döner — contentType değişir
    const responseContentType = result.fallback
      ? 'text/html; charset=utf-8'
      : result.contentType;

    return new NextResponse(result.buffer, {
      status: 200,
      headers: {
        'Content-Type': responseContentType,
        'Content-Disposition': `inline; filename="${result.filename}"`,
        'Content-Length': String(result.size),
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (err) {
    // AppError / Validation / Unauthorized → JSON format
    const { fail } = await import('@/lib/apiResponse');
    return fail(err);
  }
}