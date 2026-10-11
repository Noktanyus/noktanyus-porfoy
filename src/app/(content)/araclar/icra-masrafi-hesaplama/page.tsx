import { Metadata } from 'next';
import EnforcementCostToolClient from '@/components/tools/EnforcementCostToolClient';

export const metadata: Metadata = {
  title: 'İcra Takibi Açılış Harç ve Masraf Hesaplama | UYAP & İİK | Noktanyus',
  description:
    '2004 sayılı İcra ve İflas Kanunu ve Harçlar Kanunu (1) sayılı Tarife uyarınca ilamlı ve ilamsız icra takipleri için peşin harç (%0.5), başvurma harcı, vekalet harcı, baro pulu ve tebligat masrafı hesaplayıcı.',
  keywords: [
    'icra masrafı hesaplama',
    'icra harç hesaplama',
    'ilamsız icra takip açılış masrafı',
    'peşin harç hesaplama',
    'icra başvurma harcı 2024',
    'uyap icra takip masrafı',
    'icra tebligat gideri',
    'baro pulu 2024',
    'vekalet harcı 2024',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/icra-masrafi-hesaplama',
  },
  openGraph: {
    title: 'İcra Takibi Açılış Harç ve Masraf Hesaplama | Noktanyus',
    description:
      'İlamlı ve ilamsız icra takiplerinde başvurma harcı, peşin harç, vekalet harcı ve tebligat masraflarını tek tıkla hesaplayın.',
    url: 'https://noktanyus.com/araclar/icra-masrafi-hesaplama',
  },
};

export default function EnforcementCostPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Türkiye İcra Takibi Açılış Harç ve Masraf Hesaplama Motoru',
    url: 'https://noktanyus.com/araclar/icra-masrafi-hesaplama',
    description:
      '2004 sayılı İİK ve 492 sayılı Harçlar Kanunu uyarınca ilamlı ve ilamsız icra takip açılış harç ve masraflarını hesaplayan motor.',
    applicationCategory: 'LegalService',
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
      <EnforcementCostToolClient />
    </>
  );
}
