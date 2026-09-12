/**
 * @file /api/saas/ai/describe/bulk - SaaS API: CSV toplu üretim başlatma
 * @description POST: CSV ile toplu AI açıklama üretimi başlatır.
 *              Auth: withApiKey + scope 'ai:bulk:write'
 *
 *              İki mod:
 *                (a) multipart/form-data: 'file' alanında CSV dosyası
 *                    → R2/local'e yazılır, csvPath olarak kullanılır
 *                (b) application/json: { csvPath: "ai-bulk/<wid>/<job>.csv" }
 *                    → CSV daha önce /api/upload ile yüklenmiş olmalı
 *
 *              Body ayrıca: workspaceId, brandVoiceId, language, length, keywords.
 *              Yanıt: { jobId, totalRows, status: 'pending' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import { ensureSaasScope } from '@/lib/saasScopes';
import { assertWorkspaceAccess } from '@/lib/saasWorkspace';
import { aiBulkService } from '@/modules/ai-bulk/service';
import { BulkUploadSchema } from '@/modules/ai-bulk/schemas';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Buffer'ı R2'ye yazar, public URL döner. Başarısızsa null döner (local fallback).
 */
async function uploadCsvToR2(
  workspaceId: string,
  buffer: Buffer,
  originalName: string
): Promise<{ key: string; publicUrl: string } | null> {
  if (!process.env.R2_ACCESS_KEY_ID) return null;
  try {
    const key = `ai-bulk/${workspaceId}/${crypto.randomBytes(8).toString('hex')}-${Date.now()}-${originalName.slice(-60)}`;
    const client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: 'text/csv',
      })
    );
    return { key, publicUrl: `${process.env.R2_PUBLIC_URL}/${key}` };
  } catch (err) {
    logger.error('[saas/ai/bulk] R2 upload failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

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

export const POST = withApiKey(async (req: NextRequest, ctx) => {
  // 1. Scope kontrolü
  const scopeError = ensureSaasScope(ctx.scopes, 'ai:bulk:write');
  if (scopeError) return scopeError;

  // 2. Content-Type'a göre body parse
  const contentType = req.headers.get('content-type') ?? '';
  let body: Record<string, unknown> = {};
  let uploadedCsv: { key: string; publicUrl: string } | null = null;

  if (contentType.includes('multipart/form-data')) {
    // (a) multipart: file + workspaceId + diğer alanlar
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FORM',
            message: 'multipart/form-data parse hatası',
            details: err instanceof Error ? err.message : String(err),
          },
        },
        { status: 400 }
      );
    }

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_FILE', message: 'CSV dosyası (file) gerekli' } },
        { status: 400 }
      );
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: { code: 'FILE_TOO_LARGE', message: 'CSV 20MB sınırını aşamaz' } },
        { status: 413 }
      );
    }

    body.workspaceId = formData.get('workspaceId') ?? undefined;
    body.brandVoiceId = formData.get('brandVoiceId') ?? undefined;
    body.language = formData.get('language') ?? undefined;
    body.length = formData.get('length') ?? undefined;
    const kw = formData.get('keywords');
    if (kw && typeof kw === 'string') {
      body.keywords = kw.split(',').map((s) => s.trim()).filter(Boolean);
    }

    // 3. Workspace üyelik kontrolü (multipart body henüz set edilmedi)
    const ws = await assertWorkspaceAccess(req, ctx.userId, { body });
    if (ws.error) return ws.error;
    const workspaceId = ws.workspaceId;

    // 4. CSV'yi upload et
    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name || 'upload.csv';
    uploadedCsv =
      (await uploadCsvToR2(workspaceId, buffer, originalName)) ??
      (await uploadCsvLocal(workspaceId, buffer, originalName));
    body.csvPath = uploadedCsv.key;
  } else if (contentType.includes('application/json')) {
    // (b) JSON: csvPath + diğer alanlar
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: 'JSON body gerekli' } },
        { status: 400 }
      );
    }

    if (!body.csvPath || typeof body.csvPath !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'CSV_REQUIRED', message: 'csvPath gerekli (multipart file veya JSON alanı)' },
        },
        { status: 400 }
      );
    }

    const ws = await assertWorkspaceAccess(req, ctx.userId, { body });
    if (ws.error) return ws.error;
  } else {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNSUPPORTED_CONTENT_TYPE',
          message: 'Content-Type multipart/form-data veya application/json olmalı',
        },
      },
      { status: 415 }
    );
  }

  // 5. Bulk upload schema validation
  let input;
  try {
    input = BulkUploadSchema.parse(body);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validasyon hatası',
          details: err instanceof Error ? (err as { errors?: unknown }).errors ?? String(err) : err,
        },
      },
      { status: 400 }
    );
  }

  // 6. Job başlat
  try {
    const result = await aiBulkService.startBulkGeneration({
      workspaceId: (body.workspaceId as string) ?? '',
      userId: ctx.userId,
      input,
      csvOriginalName: uploadedCsv ? path.basename(uploadedCsv.key) : undefined,
    });

    logger.info('[saas/ai/bulk] Job started', {
      keyId: ctx.keyId,
      workspaceId: body.workspaceId,
      jobId: result.jobId,
      totalRows: result.totalRows,
      invalidRows: result.invalidRows,
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

    logger.error('[saas/ai/bulk] startBulkGeneration failed', {
      keyId: ctx.keyId,
      error: msg,
      code,
    });

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
});
