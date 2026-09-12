/**
 * SaaS Workspace Context Resolver — Phase 2 A.5
 *
 * /api/saas/* endpoint'leri workspace-scoped. Workspace ID iki şekilde sağlanır:
 *   1. Request body'de `workspaceId` alanı
 *   2. Header `X-Workspace-Id`
 *   3. Query parameter `workspaceId` (export endpoint gibi GET'ler için)
 *
 * API key'in sahibi (userId) workspace'in üyesi olmalı; aksi halde 403 döner.
 *
 * NOT: ApiKey modeli şu an workspace-scoped değil (sadece userId). Workspace
 * context resolution runtime'da yapılır: API key user → WorkspaceMember lookup.
 * İleride ApiKey'e workspaceId eklenirse bu helper basitleştirilebilir.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface SaasWorkspaceContext {
  workspaceId: string;
  userId: string;
  keyId: string;
}

export interface WorkspaceResolveOptions {
  /** JSON body'den workspaceId okunacaksa body verilir. */
  body?: Record<string, unknown> | null;
}

/**
 * Request'ten workspaceId'yi çeker (öncelik sırası: body > header > query).
 * Bulunamazsa null döner.
 */
export function extractWorkspaceId(
  req: NextRequest,
  options: WorkspaceResolveOptions = {}
): string | null {
  // 1. Body (JSON)
  const fromBody = options.body?.workspaceId;
  if (typeof fromBody === 'string' && fromBody.trim().length > 0) {
    return fromBody.trim();
  }

  // 2. Header
  const fromHeader = req.headers.get('x-workspace-id');
  if (fromHeader && fromHeader.trim().length > 0) {
    return fromHeader.trim();
  }

  // 3. Query
  const fromQuery = req.nextUrl.searchParams.get('workspaceId');
  if (fromQuery && fromQuery.trim().length > 0) {
    return fromQuery.trim();
  }

  return null;
}

/**
 * API key user'ın workspace'e üye olup olmadığını kontrol eder. Workspace
 * bulunamadıysa veya user üye değilse null döner.
 *
 * Membership kontrolü WorkspaceMember tablosundan yapılır. Aktif workspace
 * sahipliği (Subscription.userId == userId) ile sınırlı değildir — herhangi
 * bir workspace üyeliği (OWNER/ADMIN/EDITOR/VIEWER) kabul edilir. SaaS API
 * için EDITOR seviyesi yeterli.
 */
export async function resolveWorkspaceMembership(
  userId: string,
  workspaceId: string
): Promise<{ id: string } | null> {
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
    select: { id: true, role: true },
  });
  return member ? { id: member.id } : null;
}

/**
 * Tek seferde: workspaceId çıkar + üyelik doğrula. Başarısızsa hata
 * response'u, başarılıysa null döner. Route handler'da:
 *
 *   const wsError = await assertWorkspaceAccess(req, ctx, { body });
 *   if (wsError) return wsError;
 *   const workspaceId = extractWorkspaceId(req, { body })!;
 */
export async function assertWorkspaceAccess(
  req: NextRequest,
  userId: string,
  options: WorkspaceResolveOptions = {}
): Promise<{ error: NextResponse; workspaceId: null } | { error: null; workspaceId: string }> {
  const workspaceId = extractWorkspaceId(req, options);

  if (!workspaceId) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: 'WORKSPACE_REQUIRED',
            message: 'workspaceId gerekli (body, X-Workspace-Id header veya ?workspaceId= query)',
          },
        },
        { status: 400 }
      ),
      workspaceId: null,
    };
  }

  const member = await resolveWorkspaceMembership(userId, workspaceId);
  if (!member) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: 'WORKSPACE_FORBIDDEN',
            message: 'Bu workspace\'e erişim yetkiniz yok',
          },
        },
        { status: 403 }
      ),
      workspaceId: null,
    };
  }

  return { error: null, workspaceId };
}

/**
 * Job ID üzerinden workspace sahipliği kontrolü. Kullanıcı o job'a sahip
 * workspace'e üye değilse null döner.
 */
export async function getJobWorkspaceIfOwned(
  jobId: string,
  userId: string
): Promise<{ workspaceId: string } | null> {
  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
    select: { workspaceId: true },
  });
  if (!job) return null;
  const member = await resolveWorkspaceMembership(userId, job.workspaceId);
  return member ? { workspaceId: job.workspaceId } : null;
}
