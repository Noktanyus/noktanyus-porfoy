import { Metadata } from 'next';
import TrQrToolClient from '@/components/tools/TrQrToolClient';

export const metadata: Metadata = {
  title: 'TCMB TR Karekod (FAST / Havale) Oluşturucu & Çözücü | Noktanyus',
  description:
    'TCMB ve BKM EMVCo standartlarında TR Karekod oluşturun. Banka mobil uygulamalarıyla (Garanti, İşCep, Ziraat, Akbank vb.) taranabilir FAST IBAN karekodu üretin veya mevcut karekodu çözümleyin.',
  keywords: [
    'tr karekod oluşturucu',
    'fast karekod',
    'tcmb tr karekod',
    'iban karekod oluşturma',
    'karekod ile ödeme',
    'emvco tr qr',
    'bkm tr karekod',
    'karekod çözücü',
    'tr karekod api',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/tr-karekod-olusturucu',
  },
  openGraph: {
    title: 'TCMB TR Karekod (FAST / Havale) Oluşturucu & Çözücü | Noktanyus',
    description:
      'TCMB ve BKM standartlarında banka mobil uygulamalarıyla uyumlu TR Karekod oluşturma ve çözümleme aracı. API desteği ile.',
    url: 'https://noktanyus.com/araclar/tr-karekod-olusturucu',
  },
};

export default function TrQrToolPage() {
  return <TrQrToolClient />;
}
