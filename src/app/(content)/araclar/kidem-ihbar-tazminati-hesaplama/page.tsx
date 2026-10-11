import { Metadata } from 'next';
import SeverancePayToolClient from '@/components/tools/SeverancePayToolClient';

export const metadata: Metadata = {
  title: 'Kıdem & İhbar Tazminatı Hesaplama | 4857 s. İş Kanunu | Noktanyus',
  description:
    '4857 sayılı İş Kanunu ve 1475 sayılı Kanun m.14 uyarınca giydirilmiş brüt ücret, Hazine resmi kıdem tavanı, damga vergisi, ihbar önelleri, yıllık izin ve net hakediş hesaplayıcı.',
  keywords: [
    'kıdem tazminatı hesaplama',
    'ihbar tazminatı hesaplama',
    'giydirilmiş brüt ücret',
    'kıdem tazminatı tavanı 2024',
    'kıdem tazminatı tavanı 2025',
    'ihbar öneli süreleri',
    'yıllık izin ücreti hesaplama',
    'işten çıkarma tazminatı',
    'arabuluculuk tazminat hesabı',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/kidem-ihbar-tazminati-hesaplama',
  },
  openGraph: {
    title: 'Kıdem & İhbar Tazminatı Hesaplama | 4857 s. İş Kanunu | Noktanyus',
    description:
      'Giydirilmiş brüt ücret, Hazine resmi kıdem tavanı, damga vergisi, ihbar önelleri ve net tazminat hakedişinizi tek tıkla hesaplayın.',
    url: 'https://noktanyus.com/araclar/kidem-ihbar-tazminati-hesaplama',
  },
};

export default function SeverancePayPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '4857 Sayılı İş Kanunu Kıdem & İhbar Tazminatı Hesaplama Motoru',
    url: 'https://noktanyus.com/araclar/kidem-ihbar-tazminati-hesaplama',
    description:
      '1475 sayılı Kanun m.14 ve 4857 sayılı İş Kanunu m.17 uyarınca giydirilmiş brüt ücret, Hazine kıdem tavanı, ihbar önelleri ve net hakediş hesaplama motoru.',
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
      <SeverancePayToolClient />
    </>
  );
}
