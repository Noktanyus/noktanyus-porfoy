// src/app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const uploadDir = path.join(process.cwd(), 'public', 'images');

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ success: false, error: 'Yetkisiz işlem.' }, { status: 401 });
  }

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

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Optimize image with sharp
  const newFilename = `${uuidv4()}.webp`;
  const filePath = path.join(uploadDir, newFilename);

  try {
    await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true }) // Genişliği 1920px'den büyükse yeniden boyutlandır
      .webp({ quality: 80 }) // %80 kalitede WebP formatına çevir
      .toFile(filePath);

    // İstemcinin beklediği formatta başarılı yanıt döndür
    return NextResponse.json({ success: true, url: `/images/${newFilename}` });
  } catch (error) {
    console.error('Görsel işlenirken hata:', error);
    return NextResponse.json({ success: false, error: 'Görsel işlenirken bir hata oluştu.' }, { status: 500 });
  }
}
