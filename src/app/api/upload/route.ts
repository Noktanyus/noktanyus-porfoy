/**
 * @file Genel amaçlı görsel yükleme API rotası.
 * @description Bu rota, giriş yapmış kullanıcıların görsel dosyalarını
 *              (avatar, ürün thumbnail, blog kapak vb.) yüklemesine olanak
 *              tanır. Dosya `sharp` ile optimize edilir, WebP formatına
 *              dönüştürülür ve isteğe bağlı olarak Cloudflare R2'ye yazılır.
 *              R2 yapılandırılmamışsa `public/uploads/` dizinine yazılır
 *              (dev ortamı için fallback).
 *
 * Storage seçimi:
 *   - `R2_ACCESS_KEY_ID` tanımlıysa → Cloudflare R2 (S3 uyumlu API)
 *   - Değilse → Local filesystem (`public/uploads/`)
 *
 * Endpoint:
 *   POST /api/upload?type=avatar|product|blog|general
 *
 * Request: multipart/form-data (`file` alanı)
 * Response: { success: true, data: { url, filename, size, type } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const STORAGE_DIR = path.join(process.cwd(), 'public', 'uploads');

const QuerySchema = z.object({
  type: z.enum(['avatar', 'product', 'blog', 'general']).default('general'),
});

/**
 * Yüklenen buffer'ı optimize edilmiş WebP buffer'ına dönüştürür.
 * Sharp başarısız olursa orijinal buffer'ı döndürür (graceful fallback).
 */
async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch (err) {
    logger.error('Image optimization failed', { error: err });
    return buffer;
  }
}

/**
 * Buffer'ı Cloudflare R2'ye yazar. Başarısız olursa null döner.
 * S3-uyumlu API kullandığı için hem R2 hem AWS S3 ile çalışır.
 */
async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string | null> {
  try {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
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
        Body: body,
        ContentType: contentType,
      }),
    );
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  } catch (err) {
    logger.error('R2 upload failed, falling back to local', { error: err });
    return null;
  }
}

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 });
    }

    const url = new URL(req.url);
    const { type } = QuerySchema.parse({
      type: url.searchParams.get('type') ?? 'general',
    });

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return fail({ code: 'NO_FILE', message: 'Dosya bulunamadı', statusCode: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return fail({ code: 'INVALID_TYPE', message: 'Geçersiz dosya tipi', statusCode: 400 });
    }

    if (file.size > MAX_SIZE) {
      return fail({ code: 'FILE_TOO_LARGE', message: 'Dosya 5MB büyük olamaz', statusCode: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const optimized = await optimizeImage(buffer);

    // Generate unique filename
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${type}_${hash}.webp`;
    const r2Key = `uploads/${filename}`;

    // Storage backend seçimi
    const useR2 = !!process.env.R2_ACCESS_KEY_ID;

    let publicUrl: string;

    if (useR2) {
      // Cloudflare R2 upload — başarısız olursa local fallback
      const r2Url = await uploadToR2(r2Key, optimized, 'image/webp');
      if (r2Url) {
        publicUrl = r2Url;
      } else {
        await fs.mkdir(STORAGE_DIR, { recursive: true });
        await fs.writeFile(path.join(STORAGE_DIR, filename), optimized);
        publicUrl = `/uploads/${filename}`;
      }
    } else {
      // Local filesystem fallback (dev)
      await fs.mkdir(STORAGE_DIR, { recursive: true });
      await fs.writeFile(path.join(STORAGE_DIR, filename), optimized);
      publicUrl = `/uploads/${filename}`;
    }

    logger.info('File uploaded', {
      userId: (session.user as { id?: string }).id,
      type,
      filename,
      size: optimized.length,
      storage: useR2 ? 'r2' : 'local',
    });

    return ok(
      {
        url: publicUrl,
        filename,
        size: optimized.length,
        type: 'image/webp',
      },
      { status: 201 },
    ) as NextResponse;
  });
});

// Next.js App Router config — body parser devre dışı, formData kullanılıyor
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
