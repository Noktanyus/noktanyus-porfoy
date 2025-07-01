import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Popup } from '@/types/content';

const contentDirectory = path.join(process.cwd(), 'content', 'popups');

// Helper to ensure directory exists
const ensureDirectoryExistence = (filePath: string) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

// GET all popups
export async function GET() {
  try {
    const fileNames = fs.readdirSync(contentDirectory);
    const popups = fileNames
      .filter(fileName => fileName.endsWith('.json'))
      .map(fileName => {
        const fullPath = path.join(contentDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(fileContents);
        return {
          slug: fileName.replace(/\.json$/, ''),
          ...data,
        };
      });
    return NextResponse.json(popups);
  } catch (error) {
    console.error("Error fetching popups:", error);
    return NextResponse.json({ message: "Popup'lar getirilirken bir hata oluştu." }, { status: 500 });
  }
}

// POST a new popup
export async function POST(request: Request) {
  try {
    const popupData: Popup = await request.json();
    
    if (!popupData || !popupData.slug) {
      return NextResponse.json({ message: 'Eksik bilgi: slug alanı gereklidir.' }, { status: 400 });
    }

    const filePath = path.join(contentDirectory, `${popupData.slug}.json`);

    // For simplicity, we overwrite if exists. Could add checks for creation vs. update.
    const fileContent = JSON.stringify(popupData, null, 2);

    ensureDirectoryExistence(filePath);
    fs.writeFileSync(filePath, fileContent);

    return NextResponse.json({ message: 'Popup başarıyla kaydedildi.' }, { status: 201 });

  } catch (error) {
    console.error("Error creating/updating popup:", error);
    return NextResponse.json({ message: 'Popup kaydedilirken bir hata oluştu.' }, { status: 500 });
  }
}

// DELETE a popup
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        if (!slug) {
            return NextResponse.json({ message: 'Silinecek popup slug bilgisi eksik.' }, { status: 400 });
        }

        const filePath = path.join(contentDirectory, `${slug}.json`);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ message: 'Popup bulunamadı.' }, { status: 404 });
        }

        fs.unlinkSync(filePath);

        return NextResponse.json({ message: 'Popup başarıyla silindi.' });

    } catch (error) {
        console.error("Error deleting popup:", error);
        return NextResponse.json({ message: 'Popup silinirken bir hata oluştu.' }, { status: 500 });
    }
}
