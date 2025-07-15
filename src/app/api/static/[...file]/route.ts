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
  console.log(`[API/STATIC] Gelen istek: ${filePath}`);
  
  // Güvenlik için: Path traversal saldırılarını önle
  const safeFilePath = path.normalize(filePath).replace(/^(\.\.["\\\\])+/, '');

  // Sunucudaki public klasörünün mutlak yolunu oluştur
  const publicDir = path.join(process.cwd(), 'public');
  const absolutePath = path.join(publicDir, safeFilePath);
  console.log(`[API/STATIC] Dosyanın mutlak yolu: ${absolutePath}`);

  try {
    // Dosyanın varlığını ve erişilebilirliğini kontrol et
    await fs.promises.access(absolutePath);
    console.log(`[API/STATIC] Dosya bulundu: ${absolutePath}`);

    // Dosyayı oku
    const fileBuffer = await fs.promises.readFile(absolutePath);

    // MIME türünü belirle
    const mimeType = mime.lookup(absolutePath) || 'application/octet-stream';

    // Dosyayı doğru Content-Type ile döndür
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    // Dosya bulunamazsa veya başka bir hata olursa 404 döndür
    console.error(`[API/STATIC] Dosya okuma hatası: ${absolutePath}`, error);
    return new NextResponse('File not found', { status: 404 });
  }
}
