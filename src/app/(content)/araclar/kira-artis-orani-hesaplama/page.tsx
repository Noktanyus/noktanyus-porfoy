import { Metadata } from 'next';
import RentIncreaseToolClient from '@/components/tools/RentIncreaseToolClient';

export const metadata: Metadata = {
  title: 'Yasal Kira Artış Oranı & TÜFE Tavanı Hesaplama | TBK m.344 | Noktanyus',
  description:
    '6098 s. TBK m.344 uyarınca konut ve çatılı işyerleri için resmi TÜİK 12 aylık ortalama TÜFE tavan kira artış oranı, yeni yasal kira bedeli ve işyeri stopaj/KDV dökümü hesaplayıcı. Ücretsiz & API destekli.',
  keywords: [
    'kira artış oranı hesaplama',
    'yasal kira artış tavanı 2024',
    'tüfe 12 aylık ortalama kira artışı',
    'tbk 344 kira artışı',
    'işyeri kira stopaj hesaplama',
    'konut kira zammı hesaplama',
    'resmi tüik kira artış oranı',
    'tüfe kira tavanı',
    'işyeri kira kdv hesaplama',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/kira-artis-orani-hesaplama',
  },
  openGraph: {
    title: 'Yasal Kira Artış Oranı & TÜFE Tavanı Hesaplama | Noktanyus',
    description:
      'Konut ve çatılı işyeri için TÜİK 12 aylık TÜFE tavan oranıyla yasal azami kira bedelini ve artış tutarını hesaplayın.',
    url: 'https://noktanyus.com/araclar/kira-artis-orani-hesaplama',
  },
};

export default function RentIncreasePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Yasal Kira Artış Oranı & TÜFE Tavanı Hesaplama Aracı',
    url: 'https://noktanyus.com/araclar/kira-artis-orani-hesaplama',
    description:
      '6098 sayılı Türk Borçlar Kanunu Madde 344 uyarınca TÜİK 12 aylık ortalama TÜFE tavan kira artış oranı hesaplayıcı.',
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
      <RentIncreaseToolClient />
    </>
  );
}
