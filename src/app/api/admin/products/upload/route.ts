/**
 * @file /api/admin/products/upload - POST
 * @description Admin için dijital ürün / yazılım yükleme API rotası.
 *              Masaüstü uygulamaları (.exe, .msi, .dmg, .pkg, .zip, .rar vb.)
 *              ve dijital paketleri yükler, boyut ve ad bilgilerini döner.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// Maksimum dosya boyutu: 500 MB (yazılım paketleri & installerlar için)
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için yönetici yetkisi gereklidir' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Yüklenecek dosya seçilmedi' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Dosya boyutu çok büyük. Maksimum 500MB yüklenebilir.`,
        },
        { status: 413 }
      );
    }

    const originalName = file.name || 'product-file.zip';
    const originalExt = path.extname(originalName) || '.zip';
    const baseCleanName = path
      .basename(originalName, originalExt)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '_')
      .slice(0, 50);

    const uniqueId = uuidv4().slice(0, 8);
    const storedFileName = `${baseCleanName}_${uniqueId}${originalExt}`;

    // R2 yapılandırılmışsa R2'ye yükle, aksi halde yerel diske kaydet
    let finalUrl = '';
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_ENDPOINT
    ) {
      try {
        const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
        const s3 = new S3Client({
          region: 'auto',
          endpoint: process.env.R2_ENDPOINT,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          },
        });

        const key = `products/${storedFileName}`;
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: file.type || 'application/octet-stream',
          })
        );

        finalUrl = process.env.R2_PUBLIC_URL
          ? `${process.env.R2_PUBLIC_URL}/${key}`
          : `/api/static/uploads/products/${storedFileName}`;
      } catch (r2Error) {
        logger.error('[ProductUpload] R2 yükleme başarısız, yerel diske yazılıyor', {
          error: r2Error,
        });
      }
    }

    // Yerel diske her ihtimale karşı veya R2 yoksa kaydet
    if (!finalUrl) {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      const localFilePath = path.join(UPLOAD_DIR, storedFileName);
      await fs.writeFile(localFilePath, buffer);
      finalUrl = `/api/static/uploads/products/${storedFileName}`;
    }

    await logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: 'CREATE',
      resource: 'ProductFile',
      details: {
        originalName,
        storedFileName,
        fileSize: file.size,
        url: finalUrl,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        url: finalUrl,
        fileName: originalName,
        fileSize: file.size,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Dosya yüklenirken hata oluştu';
    logger.error('[ProductUpload] Hata', { error });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
