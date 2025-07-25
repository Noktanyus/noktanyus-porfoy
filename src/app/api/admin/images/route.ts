
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { withAdminAuth } from '@/lib/auth-utils';

const imagesDirectory = path.join(process.cwd(), 'public/images');

async function getImages() {
  try {
    const files = await fs.readdir(imagesDirectory);
    const imageFiles = files.filter(file => /\.(webp|png|jpg|jpeg|gif)$/i.test(file));
    return imageFiles.map(file => ({
      name: file,
      url: `/images/${file}`,
    }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.mkdir(imagesDirectory, { recursive: true });
      return [];
    }
    throw error;
  }
}

const getHandler = async (request: NextRequest) => {
  try {
    const images = await getImages();
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error getting images:', error);
    return NextResponse.json({ message: 'Error getting images' }, { status: 500 });
  }
};

const deleteHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');

  if (!fileName) {
    return NextResponse.json({ message: 'File name is required' }, { status: 400 });
  }

  try {
    const filePath = path.join(imagesDirectory, fileName);
    await fs.unlink(filePath);
    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ message: 'Error deleting image' }, { status: 500 });
  }
};

export const GET = withAdminAuth(getHandler);
export const DELETE = withAdminAuth(deleteHandler);

