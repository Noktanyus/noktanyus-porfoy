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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
    return NextResponse.json({ error: 'Failed to create upload directory' }, { status: 500 });
  }

  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Optimize image with sharp
  const newFilename = `${uuidv4()}.webp`;
  const filePath = path.join(uploadDir, newFilename);

  try {
    await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true }) // Resize if wider than 1920px
      .webp({ quality: 80 }) // Convert to WebP with 80% quality
      .toFile(filePath);

    return NextResponse.json({ filePath: `/images/${newFilename}` });
  } catch (error) {
    console.error('Error optimizing image:', error);
    return NextResponse.json({ error: 'Failed to optimize image' }, { status: 500 });
  }
}