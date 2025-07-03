/**
 * @file Belirli bir popup verisini getirmek için dinamik API rotası (Yeniden Düzenlenmiş)
 * @description Bu rota, URL'den gelen `slug` parametresini kullanarak
 *              `contentService` aracılığıyla ilgili popup'ın JSON verisini okur ve döndürür.
 */

import { NextResponse } from 'next/server';
import * as contentService from '@/services/contentService';

type RouteParams = {
  params: {
    slug: string;
  };
};

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = params;
    
    // content-parser yerine contentService'i kullan
    const { data } = await contentService.getContent('popups', `${slug}.json`);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Popup getirme hatası (slug: ${params.slug}):`, error);
    
    if (error.message.includes('bulunamadı')) {
      return NextResponse.json({ message: 'İstenen popup bulunamadı.' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Popup verisi alınırken sunucuda bir hata oluştu.' }, { status: 500 });
  }
}