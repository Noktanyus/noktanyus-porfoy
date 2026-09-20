import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';

export async function GET(
  req: NextRequest,
  { params }: { params: { file: string[] } }
) {
  // URL'den dosya yolunu al ve birleştir
  const filePath = params.file.join('/');

  // Güvenlik için: Path traversal saldırılarını önle
  const safeFilePath = path.normalize(filePath).replace(/^(\.\.["\\\\])+/, '');

  // Sunucudaki public klasörünün mutlak yolunu oluştur
  const publicDir = path.join(process.cwd(), 'public');
  const baseName = path.basename(safeFilePath);

  // Aday dosya yolları
  const candidatePaths = [
    path.join(publicDir, safeFilePath),
    path.join(publicDir, 'images', safeFilePath),
    path.join(publicDir, 'images', 'products', baseName),
    path.join(publicDir, 'products', baseName),
    path.join(publicDir, 'uploads', safeFilePath),
    path.join(publicDir, baseName),
  ];

  let resolvedPath: string | null = null;
  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      resolvedPath = candidate;
      break;
    }
  }

  try {
    if (!resolvedPath) {
      throw new Error(`File not found: ${safeFilePath}`);
    }

    // Dosyayı oku
    const fileBuffer = await fs.promises.readFile(resolvedPath);

    // MIME türünü belirle
    const mimeType = mime.lookup(resolvedPath) || 'application/octet-stream';

    // Dosyayı doğru Content-Type ile döndür
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    // Dosya bulunamazsa placeholder.webp dosyasını göstermeyi dene
    console.warn(`[API/STATIC] Dosya bulunamadı: ${safeFilePath}. Placeholder denenecek.`);
    try {
      const placeholderPath = path.join(publicDir, 'images', 'placeholder.webp');
      const placeholderBuffer = await fs.promises.readFile(placeholderPath);
      const mimeType = 'image/webp';

      return new NextResponse(placeholderBuffer, {
        status: 200, // Bulunamayan resim yerine placeholder gösterildiği için 200 OK
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=3600, must-revalidate', // Daha kısa cache süresi
        },
      });
    } catch (placeholderError) {
      // Placeholder dosyası da bulunamazsa 404 hatası döndür
      console.error(`[API/STATIC] Placeholder dosyası da okunamadı!`, placeholderError);
      return new NextResponse('File not found', { status: 404 });
    }
  }
}
