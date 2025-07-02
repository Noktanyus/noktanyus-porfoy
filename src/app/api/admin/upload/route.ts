/**
 * @file Resim yükleme ve optimizasyon için API rotası.
 * @description Bu rota, yönetim panelinden yüklenen resimleri alır, `sharp`
 *              kütüphanesi ile optimize eder (yeniden boyutlandırma ve .webp
 *              formatına dönüştürme), sunucuya kaydeder ve yeni dosyanın
 *              URL'sini döndürür. Sadece kimliği doğrulanmış kullanıcılar
 *              bu işlemi yapabilir.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { env } from '@/lib/env';

// Yüklenen resimlerin kaydedileceği dizin
const uploadDir = path.join(process.cwd(), 'public', 'images');

export async function POST(request: NextRequest) {
  // Kullanıcı kimliğini doğrula
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ success: false, error: 'Yetkisiz işlem.' }, { status: 401 });
  }

  // Yükleme dizininin var olduğundan emin ol, yoksa oluştur
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Yükleme dizini oluşturulurken hata:', error);
    return NextResponse.json({ success: false, error: 'Sunucuda yükleme dizini oluşturulamadı.' }, { status: 500 });
  }

  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'Yüklenecek dosya bulunamadı.' }, { status: 400 });
  }

  // Dosyayı buffer'a oku
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Benzersiz bir dosya adı oluştur ve .webp uzantısı ekle
  const newFilename = `${uuidv4()}.webp`;
  const filePath = path.join(uploadDir, newFilename);

  try {
    // Sharp kütüphanesi ile resmi işle
    await sharp(buffer)
      .resize({ 
        width: 1920, // Maksimum genişlik
        height: 1080, // Maksimum yükseklik
        fit: 'inside', // Oranları koruyarak bu boyutların içine sığdır
        withoutEnlargement: true // Resim daha küçükse büyütme
      })
      .webp({ quality: 80 }) // %80 kalitede WebP formatına çevir
      .toFile(filePath);

    // İstemcinin beklediği formatta başarılı yanıt döndür
    // Dönen URL, 'public' klasörünün kökünden başlar.
    return NextResponse.json({ success: true, url: `/images/${newFilename}` });
  } catch (error) {
    console.error('Görsel işlenirken veya kaydedilirken hata:', error);
    return NextResponse.json({ success: false, error: 'Görsel işlenirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}
