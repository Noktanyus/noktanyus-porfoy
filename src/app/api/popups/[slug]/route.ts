/**
 * @file Belirli bir popup verisini getirmek için dinamik API rotası.
 * @description Bu rota, URL'den gelen `slug` parametresini kullanarak
 *              ilgili popup'ın JSON dosyasını okur ve içeriğini döndürür.
 */

import { NextResponse } from 'next/server';
import { getPopupData } from '@/lib/content-parser';

// Next.js'in dinamik rota parametrelerini alabilmesi için tip tanımı
type RouteParams = {
  params: {
    slug: string;
  };
};

/**
 * GET isteğini işler ve slug'a göre popup verisini döndürür.
 * @param request - Gelen HTTP isteği (kullanılmıyor).
 * @param params - Rota parametreleri, `slug`'ı içerir.
 * @returns {NextResponse} Popup verisini veya hata mesajını içeren JSON yanıtı.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = params;
    
    // İçerik ayrıştırıcıyı kullanarak popup verisini al
    const popup = getPopupData(slug);

    // Popup bulunamazsa, 404 Not Found durum koduyla hata döndür
    if (!popup) {
      return NextResponse.json({ message: 'İstenen popup bulunamadı.' }, { status: 404 });
    }

    // Popup verisini başarıyla döndür
    return NextResponse.json(popup);
  } catch (error) {
    // Herhangi bir hata oluşursa, sunucu konsoluna hatayı yazdır ve 500 durum koduyla genel bir hata mesajı döndür
    console.error(`Popup getirme hatası (slug: ${params.slug}):`, error);
    return NextResponse.json({ message: 'Popup verisi alınırken sunucuda bir hata oluştu.' }, { status: 500 });
  }
}
