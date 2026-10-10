import { Metadata } from 'next';
import SmmToolClient from '@/components/tools/SmmToolClient';

export const metadata: Metadata = {
  title: 'Serbest Meslek Makbuzu (SMM) Hesaplama Aracı | Net / Brüt Stopaj & Tevkifat',
  description:
    'Brütten nete veya netten brüte Serbest Meslek Makbuzu (SMM) hesaplayın. %20 stopaj, %20 KDV ve 5/10, 9/10 tevkifat oranları ile ele geçen net tutar, müşteri maliyeti ve vergi dökümünü kuruş hassasiyetinde görün.',
  keywords: [
    'smm hesaplama',
    'serbest meslek makbuzu hesaplama',
    'netten brüte smm',
    'brütten nete smm',
    'smm stopaj hesaplama',
    'smm kdv tevkifat',
    'avukat smm hesaplama',
    'yazılımcı smm',
    'smm api',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/smm-hesaplama',
  },
  openGraph: {
    title: 'Serbest Meslek Makbuzu (SMM) Hesaplama Aracı | Noktanyus',
    description:
      'GVK m.94 uyumlu Serbest Meslek Makbuzu (e-SMM) netten brüte hesaplama ve vergi döküm aracı. API desteği ile.',
    url: 'https://noktanyus.com/araclar/smm-hesaplama',
  },
};

export default function SmmPage() {
  return <SmmToolClient />;
}
