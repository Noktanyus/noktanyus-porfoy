import { Metadata } from 'next';
import InflationPurchasingPowerToolClient from '@/components/tools/InflationPurchasingPowerToolClient';

export const metadata: Metadata = {
  title: 'TÜİK TÜFE Tarihi Enflasyon & Paranın Alım Gücü Hesaplama | Noktanyus',
  description:
    'TÜİK 2003=100 Tüketici Fiyat Endeksi serisi ile geçmiş bir tutarın günümüz satın alma gücü eşdeğeri, kümülatif enflasyon, yıllık bileşik artış ve alım gücü kaybı hesaplayıcı.',
  keywords: [
    'enflasyon hesaplama',
    'alım gücü hesaplama',
    'tüik tüfe endeksi geçmiş',
    'paranın reel değeri',
    'tüfe endeks tablosu 2003 2024',
    'tarihi enflasyon hesaplama',
    'sözleşme uyarlama davası tüfe',
    'geçmiş paranın bugünkü değeri',
    'enflasyon erimesi hesaplama',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/enflasyon-alim-gucu-hesaplama',
  },
  openGraph: {
    title: 'TÜİK TÜFE Tarihi Enflasyon & Paranın Alım Gücü Hesaplama | Noktanyus',
    description:
      'Resmi TÜİK 2003=100 TÜFE endeksleri ile geçmiş bir paranın bugünkü satın alma gücü karşılığını, kümülatif enflasyonu ve erime oranını anında hesaplayın.',
    url: 'https://noktanyus.com/araclar/enflasyon-alim-gucu-hesaplama',
  },
};

export default function InflationPurchasingPowerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TÜİK TÜFE Tarihi Enflasyon & Paranın Alım Gücü Hesaplama Motoru',
    url: 'https://noktanyus.com/araclar/enflasyon-alim-gucu-hesaplama',
    description:
      'Türkiye İstatistik Kurumu (TÜİK) resmi 2003=100 Tüketici Fiyat Endeksi verileri ile geçmiş yıllardaki paranın günümüz eşdeğer alım gücü ve kümülatif enflasyon hesaplayıcı.',
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
      <InflationPurchasingPowerToolClient />
    </>
  );
}
