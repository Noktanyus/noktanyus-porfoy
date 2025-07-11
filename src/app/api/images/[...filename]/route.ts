// src/app/api/images/[...filename]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';

const publicDir = path.join(process.cwd(), 'public');

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  const filename = params.filename.join('/');
  const filePath = path.join(publicDir, 'images', filename);

  // Path traversal saldırılarını önle
  if (!filePath.startsWith(path.join(publicDir, 'images'))) {
    return new NextResponse('Geçersiz dosya yolu', { status: 400 });
  }

  try {
    const fileBuffer = await fs.readFile(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: { 'Content-Type': mimeType },
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return new NextResponse('Dosya bulunamadı', { status: 404 });
    }
    return new NextResponse('Dosya okunurken bir hata oluştu', { status: 500 });
  }
}
