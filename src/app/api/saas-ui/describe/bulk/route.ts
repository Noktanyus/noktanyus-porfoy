/**
 * @file /api/saas-ui/describe/bulk - Session-based toplu CSV üretim başlatma.
 * @description /api/saas/ai/describe/bulk API-key tabanlıdır; UI için
 *              session-bridged sürüm. Workspace otomatik çözümlenir.
 *
 *              multipart/form-data: 'file' (CSV, maks 5MB) + brandVoiceId? +
 *              language + length + keywords?
 *
 *              CSV → R2 (yoksa local /public/uploads/ai-bulk-input/...) yazılır,
 *              sonra startBulkGeneration çağrılır.
 *
 *              Auth: getServerSession
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startBulkGeneration } from '@/modules/ai-bulk/service';
import { logger } from '@/lib/logger';
import { BulkUploadSchema } from '@/modules/ai-bulk/schemas';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * CSV'yi public/uploads/ai-bulk-input/<workspaceId>/ altına yazar.
 * Prod'da R2 kullanılır (R2 env varsa) — şimdilik local fallback yeterli
 * çünkü UI MVP'si için.
 */
async function uploadCsvLocal(
  workspaceId: string,
  buffer: Buffer,
  originalName: string
): Promise<{ key: string; publicUrl: string }> {
  const dir = path.join(process.cwd(), 'public', 'uploads', 'ai-bulk-input', workspaceId);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${crypto.randomBytes(6).toString('hex')}-${Date.now()}-${originalName.slice(-60)}`;
  await fs.writeFile(path.join(dir, filename), buffer);
  return {
    key: path.join('uploads', 'ai-bulk-input', workspaceId, filename),
    publicUrl: `/uploads/ai-bulk-input/${workspaceId}/${filename}`,
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Giriş gerekli' } },
      { status: 401 }
    );
  }

  const userId = session.user.id as string;

  // Workspace resolve
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: 'desc' },
    select: { workspaceId: true },
  });
  if (!membership) {
    return NextResponse.json(
      { success: false, error: { code: 'WORKSPACE_REQUIRED', message: 'Önce bir workspace oluşturun' } },
      { status: 400 }
    );
  }
  const workspaceId = membership.workspaceId;

  // Multipart parse
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_FORM', message: 'multipart/form-data parse hatası' } },
      { status: 400 }
    );
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: { code: 'FILE_REQUIRED', message: 'CSV dosyası (file) gerekli' } },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { success: false, error: { code: 'FILE_TOO_LARGE', message: 'CSV 5MB sınırını aşamaz' } },
      { status: 413 }
    );
  }
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_FILE_TYPE', message: 'Yalnızca .csv desteklenir' } },
      { status: 415 }
    );
  }

  const brandVoiceId = (formData.get('brandVoiceId') as string | null) ?? null;
  const language = (formData.get('language') as string | null) ?? 'tr';
  const length = (formData.get('variant') as string | null) ?? (formData.get('length') as string | null) ?? 'medium';
  const keywordsRaw = (formData.get('keywords') as string | null) ?? '';
  const keywords = keywordsRaw
    ? keywordsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  // Brand voice workspace-scoped doğrulama
  if (brandVoiceId) {
    const voice = await prisma.brandVoice.findFirst({
      where: { id: brandVoiceId, workspaceId },
      select: { id: true },
    });
    if (!voice) {
      return NextResponse.json(
        { success: false, error: { code: 'BRAND_VOICE_NOT_FOUND', message: 'Marka sesi bu workspace\'e ait değil' } },
        { status: 404 }
      );
    }
  }

  // CSV upload
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadCsvLocal(workspaceId, buffer, file.name);

  // Schema validate (workspaceId ayrı tutulur — schema'da yok)
  const input = BulkUploadSchema.parse({
    csvPath: uploaded.key,
    brandVoiceId: brandVoiceId ?? undefined,
    language,
    length,
    keywords: keywords.length ? keywords : undefined,
  });

  try {
    const result = await startBulkGeneration({
      workspaceId,
      userId,
      input,
      csvOriginalName: path.basename(uploaded.key),
    });

    logger.info('[saas-ui/bulk] Job started', {
      userId,
      workspaceId,
      jobId: result.jobId,
      totalRows: result.totalRows,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          jobId: result.jobId,
          totalRows: result.totalRows,
          invalidRows: result.invalidRows,
          status: 'pending',
        },
      },
      { status: 202 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = (err as { code?: string }).code;
    logger.error('[saas-ui/bulk] startBulkGeneration failed', { error: msg, code, userId });

    if (code === 'QUOTA_EXCEEDED') {
      return NextResponse.json(
        { success: false, error: { code, message: msg } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'BULK_START_FAILED', message: msg } },
      { status: 400 }
    );
  }
}
