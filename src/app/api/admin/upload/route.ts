// src/app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';



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

  const fileExtension = path.extname(file.name);
  const newFilename = `${uuidv4()}${fileExtension}`;
  const filePath = path.join(uploadDir, newFilename);

  await fs.writeFile(filePath, buffer);

  return NextResponse.json({ filePath: `/images/${newFilename}` });
}