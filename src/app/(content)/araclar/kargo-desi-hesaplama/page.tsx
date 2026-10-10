import { Metadata } from 'next';
import CargoToolClient from '@/components/tools/CargoToolClient';

export const metadata: Metadata = {
  title: 'Kargo Desi Hesaplama & Takip No Tespiti | Türkiye Standartları',
  description:
    'Türkiye standartlarında (bölücü 3000) kargo desi ve ücrete esas ağırlık hesaplayıcı. 9 büyük Türk kargo firması için otomatik takip no ve barkod tespiti.',
  keywords: [
    'kargo desi hesaplama',
    'desi hesaplama',
    'kargo takip numarası bulucu',
    'desi formülü',
    'ücrete esas ağırlık',
    'trendyol express takip',
    'hepsijet takip',
    'yurtiçi kargo takip',
    'aras kargo takip',
    'mng kargo takip',
    'ptt kargo takip',
    'kargo api',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/kargo-desi-hesaplama',
  },
  openGraph: {
    title: 'Kargo Desi Hesaplama & Takip No Tespiti | Noktanyus',
    description:
      'Türkiye standartlarında kargo desi hesaplayıcı ve otomatik kargo firması tespit aracı. API desteği ile.',
    url: 'https://noktanyus.com/araclar/kargo-desi-hesaplama',
  },
};

export default function CargoToolPage() {
  return <CargoToolClient />;
}
