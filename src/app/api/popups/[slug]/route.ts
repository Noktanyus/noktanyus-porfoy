
import { NextRequest, NextResponse } from 'next/server';
import { getPopup } from '@/services/contentService';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    if (!slug) {
      return NextResponse.json({ error: 'Slug parametresi eksik.' }, { status: 400 });
    }

    const popup = await getPopup(slug);

    if (!popup) {
      return NextResponse.json({ error: 'Popup bulunamadı.' }, { status: 404 });
    }

    // Sadece aktif olan popup'ların dönmesini sağla
    if (!popup.isActive) {
        return NextResponse.json({ error: 'Popup aktif değil.' }, { status: 403 });
    }


    return NextResponse.json(popup);
  } catch (error) {
    console.error(`[API /api/popups/{slug}] Hata:`, error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
