/**
 * @file Resim yükleme ve optimizasyon için API rotası.
 * @description Bu rota, yönetim panelinden yüklenen resimleri alır, `sharp`
 *              kütüphanesi ile optimize eder, sunucuya kaydeder ve yeni dosyanın
 *              genel URL'sini döndürür. Sadece 'admin' rolüne sahip kullanıcılar
 *              bu işlemi yapabilir ve dosya boyutu kontrol edilir.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { env } from '@/lib/env';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Yüklenen resimlerin kaydedileceği dizin
const uploadDir = path.join(process.cwd(), 'public', 'images');

import { withAdminAuth } from '@/lib/auth-utils';

async function uploadHandler(request: NextRequest) {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Yükleme dizini oluşturulurken hata:', error);
    return NextResponse.json({ success: false, error: 'Sunucuda yükleme dizini hazırlanamadı.' }, { status: 500 });
  }

  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'Yüklenecek dosya bulunamadı.' }, { status: 400 });
  }

  // 2. Güvenlik: Dosya boyutu kontrolü
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ success: false, error: `Dosya boyutu çok büyük. Maksimum ${MAX_FILE_SIZE_MB}MB olmalıdır.` }, { status: 413 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const newFilename = `${uuidv4()}.webp`;
  const filePath = path.join(uploadDir, newFilename);

  try {
    // 3. Güvenlik: Dosyayı yeniden işleyerek temizle
    await sharp(buffer)
      .resize({ 
        width: 1920,
        height: 1080,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(filePath);

    // 4. Doğru URL'i döndür
    const finalUrl = `/api/static/images/${newFilename}`;
    return NextResponse.json({ success: true, url: finalUrl });
  } catch (error) {
    console.error('Görsel işlenirken veya kaydedilirken hata:', error);
    return NextResponse.json({ success: false, error: 'Görsel işlenirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}

export const POST = withAdminAuth(uploadHandler);
