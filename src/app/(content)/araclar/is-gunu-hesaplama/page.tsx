import { Metadata } from 'next';
import BusinessDaysToolClient from '@/components/tools/BusinessDaysToolClient';

export const metadata: Metadata = {
  title: 'Türkiye İş Günü ve Resmi Tatil Hesaplama Aracı | Online Ücretsiz',
  description:
    'İki tarih arasındaki resmi tatil ve hafta sonlarını düşerek net Türkiye iş günü sayısını hesaplayın. İK, hukuk ve teslimat süreleri için ücretsiz araç.',
  keywords: [
    'iş günü hesaplama',
    'çalışma günü hesaplama',
    'resmi tatil günleri',
    'iş günü api',
    'türkiye tatil takvimi',
  ],
  openGraph: {
    title: 'Türkiye İş Günü ve Resmi Tatil Hesaplama Aracı | Noktanyus',
    description: 'Türkiye resmi tatil takvimine göre net iş günü hesaplayıcı.',
    url: 'https://noktanyus.com/araclar/is-gunu-hesaplama',
  },
};

export default function BusinessDaysPage() {
  return <BusinessDaysToolClient />;
}
