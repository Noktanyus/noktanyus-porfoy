/**
 * AI Bulk Generation — CSV Upload API (Phase 2 A.2)
 *
 * POST /api/ai/bulk/upload
 *   multipart/form-data → "file" (CSV), "workspaceId"
 *   Response: { success, data: { csvPath, originalName, size } }
 *
 * CSV'yi R2'ye (yoksa local filesystem'a) yazar; path döner.
 * Frontend bu path'i /api/ai/bulk/jobs endpoint'ine göndererek
 * startBulkGeneration'ı tetikler.
 *
 * Storage pattern: /api/upload ile aynı (R2 varsa R2, yoksa local).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const ALLOWED_EXTENSIONS = ['.csv', '.txt'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const FormSchema = z.object({
  workspaceId: z.string().min(1).max(100),
});

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const workspaceIdRaw = formData.get('workspaceId');

    const parsed = FormSchema.safeParse({ workspaceId: workspaceIdRaw });
    if (!parsed.success) {
      return fail({
        code: 'INVALID_INPUT',
        message: 'workspaceId zorunlu',
        statusCode: 400,
        details: parsed.error.errors,
      });
    }

    if (!file || !(file instanceof File)) {
      return fail({ code: 'NO_FILE', message: 'CSV dosyası bulunamadı', statusCode: 400 });
    }

    const ext = path.extname(file.name ?? '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return fail({
        code: 'INVALID_TYPE',
        message: 'Sadece .csv veya .txt kabul edilir',
        statusCode: 400,
      });
    }

    if (file.size > MAX_SIZE) {
      return fail({
        code: 'FILE_TOO_LARGE',
        message: 'CSV 10MB büyük olamaz',
        statusCode: 400,
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `bulk_${parsed.data.workspaceId}_${hash}.csv`;
    const storageKey = `ai-bulk/${parsed.data.workspaceId}/${filename}`;

    let csvPath: string;

    if (process.env.R2_ACCESS_KEY_ID) {
      try {
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
            Key: storageKey,
            Body: buffer,
            ContentType: 'text/csv',
          })
        );
        // csvPath = R2 key (private — readCsvText S3 client ile çeker)
        csvPath = storageKey;
      } catch (err) {
        logger.warn('[ai-bulk] R2 upload failed, using local fallback', { error: err });
        // Local fallback
        const dir = path.join(process.cwd(), 'public', 'uploads', 'ai-bulk', parsed.data.workspaceId);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, filename), buffer);
        csvPath = `/uploads/ai-bulk/${parsed.data.workspaceId}/${filename}`;
      }
    } else {
      const dir = path.join(process.cwd(), 'public', 'uploads', 'ai-bulk', parsed.data.workspaceId);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, filename), buffer);
      csvPath = `/uploads/ai-bulk/${parsed.data.workspaceId}/${filename}`;
    }

    logger.info('[ai-bulk] CSV uploaded', {
      userId: (session.user as { id?: string }).id,
      workspaceId: parsed.data.workspaceId,
      originalName: file.name,
      csvPath,
      size: buffer.length,
    });

    return ok(
      {
        csvPath,
        originalName: file.name,
        size: buffer.length,
      },
      { status: 201 }
    ) as NextResponse;
  });
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
