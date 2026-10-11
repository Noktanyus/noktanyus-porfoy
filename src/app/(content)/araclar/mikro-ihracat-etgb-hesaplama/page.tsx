import { Metadata } from 'next';
import MicroExportEtgbToolClient from '@/components/tools/MicroExportEtgbToolClient';

export const metadata: Metadata = {
  title: 'Mikro İhracat (ETGB) Uygunluk & KDV İadesi Hesaplama | E-İhracat Motoru | Noktanyus',
  description:
    '300 kg ve 15.000 € mikro ihracat (ETGB) limit kontrolü, KDVK m.11/1-a (Kod 301) sıfır KDV istisnası, yüklenilen KDV iadesi ve GVK m.89/16 %50 kazanç indirimi hesaplayıcı ve cURL / REST API.',
  keywords: [
    'mikro ihracat hesaplama',
    'etgb limitleri 2024',
    '300 kg 15000 euro mikro ihracat',
    'e-ihracat kdv iadesi hesaplama',
    '301 mal ihracatı istisnası',
    'gvk 89 16 ihracat kazanç indirimi',
    'mikro ihracat hızlı kargo etgb',
    'dhl etgb mikro ihracat',
    'fedex etgb hesaplama',
    'ups mikro ihracat faturası',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/mikro-ihracat-etgb-hesaplama',
  },
  openGraph: {
    title: 'Mikro İhracat (ETGB) & KDV İadesi Hesaplama Motoru | Noktanyus',
    description:
      '300 kg / 15.000 € mikro ihracat uygunluğu, sıfır KDV istisnası, nakden KDV iadesi ve %50 gelir vergisi istisnası hesaplayıcı.',
    url: 'https://noktanyus.com/araclar/mikro-ihracat-etgb-hesaplama',
  },
};

export default function MicroExportEtgbPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Mikro İhracat (ETGB) Uygunluk ve KDV İadesi Hesaplama Motoru',
    url: 'https://noktanyus.com/araclar/mikro-ihracat-etgb-hesaplama',
    description:
      'Türkiye e-ihracat ve mikro ihracat gönderileri için 300 kg / 15.000 € limit kontrolü, 301 KDV istisnası ve vergi teşviki simülatörü.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TRY',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MicroExportEtgbToolClient />
    </>
  );
}
