import { Metadata } from 'next';
import TaxLateInterestToolClient from '@/components/tools/TaxLateInterestToolClient';

export const metadata: Metadata = {
  title: 'Vergi Gecikme Zammı & Tecil Faizi Hesaplama | 6183 s.K. m.51 | Noktanyus',
  description:
    '6183 sayılı AATUHK m.51 uyarınca vadesi geçmiş vergi, KDV, stopaj, MTV ve SGK prim borçları için aylık/günlük gecikme zammı ve m.48 tecil faizi hesaplayıcı.',
  keywords: [
    'vergi gecikme zammı hesaplama',
    'gecikme zammı oranı 2024',
    '6183 sayılı kanun gecikme zammı',
    'vergi tecil faizi hesaplama',
    'sgk gecikme zammı hesaplama',
    'kdv gecikme zammı',
    'vergi affı yapılandırma hesaplama',
    'gib gecikme zammı tablosu',
    '8484 sayılı cumhurbaşkanı kararı',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/vergi-gecikme-zammi-hesaplama',
  },
  openGraph: {
    title: 'Vergi Gecikme Zammı & Tecil Faizi Hesaplama | 6183 s.K. m.51 | Noktanyus',
    description:
      'Vadesinde ödenmeyen kamu borçları için 8484 sayılı CB Kararı uyarınca güncel aylık (%4.50) ve günlük gecikme zammı ile tecil taksit planı hesaplayıcı.',
    url: 'https://noktanyus.com/araclar/vergi-gecikme-zammi-hesaplama',
  },
};

export default function TaxLateInterestPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '6183 Sayılı Kanun Vergi Gecikme Zammı ve Tecil Faizi Hesaplama Motoru',
    url: 'https://noktanyus.com/araclar/vergi-gecikme-zammi-hesaplama',
    description:
      '6183 sayılı AATUHK m.51 uyarınca vadesinde ödenmeyen kamu borçları için aylık/günlük gecikme zammı ve m.48 uyarınca tecil faizi hesaplama motoru.',
    applicationCategory: 'FinanceApplication',
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
      <TaxLateInterestToolClient />
    </>
  );
}
