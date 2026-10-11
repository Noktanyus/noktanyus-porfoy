import { Metadata } from 'next';
import ShippingTierToolClient from '@/components/tools/ShippingTierToolClient';

export const metadata: Metadata = {
  title: 'Kargo Fiyat Hesaplama & Çoklu Taşıyıcı Karşılaştırma | Noktanyus',
  description:
    'Yurtiçi Kargo, Aras, MNG, Sürat, PTT, Trendyol Express ve HepsiJet barem fiyatları, hacimsel desi vs ağırlık karşılaştırması ve en ucuz kargo hesaplama aracı.',
  keywords: [
    'kargo fiyat hesaplama',
    'kargo ücreti hesaplama',
    'kargo desi barem fiyatları',
    'en ucuz kargo hangisi',
    'yurtiçi kargo fiyat hesaplama',
    'aras kargo barem fiyatları',
    'ptt kargo fiyat hesaplama',
    'trendyol express barem fiyatları',
    'e-ticaret kargo maliyeti',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/kargo-fiyat-hesaplama',
  },
  openGraph: {
    title: 'Kargo Fiyat Hesaplama & Çoklu Taşıyıcı Karşılaştırma | Noktanyus',
    description:
      '8 kargo firmasının tahmini barem fiyatlarını, akaryakıt payını ve KDV dahil maliyetlerini anında karşılaştırın, en ucuz taşıyıcıyı bulun.',
    url: 'https://noktanyus.com/araclar/kargo-fiyat-hesaplama',
  },
};

export default function ShippingTierPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Çoklu Taşıyıcı Kargo Barem Fiyatlandırma & Karşılaştırma Motoru',
    url: 'https://noktanyus.com/araclar/kargo-fiyat-hesaplama',
    description:
      'Türkiye popüler kargo taşıyıcıları (Yurtiçi, Aras, MNG, Sürat, PTT, TEX, HepsiJet, Kolay Gelsin) için desi/ağırlık matrahı, barem kategorisi, akaryakıt payı ve KDV dahil fiyat karşılaştırma motoru.',
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
      <ShippingTierToolClient />
    </>
  );
}
