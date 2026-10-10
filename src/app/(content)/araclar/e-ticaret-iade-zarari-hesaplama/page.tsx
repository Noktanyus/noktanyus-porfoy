import { Metadata } from 'next';
import ReturnLossToolClient from '@/components/tools/ReturnLossToolClient';

export const metadata: Metadata = {
  title: 'E-Ticaret İade Zararı & Gerçek Kâr Marjı Hesaplama | Trendyol & Hepsiburada | Noktanyus',
  description:
    'E-ticaret ve pazaryeri satışlarında iade kaynaklı çift yönlü kargo maliyeti, amortisman zararı ve ambalaj kaybını simüle edin. Sipariş başına efektif net kârınızı ve başa baş iade limitini hesaplayın.',
  keywords: [
    'e-ticaret iade oranı hesaplama',
    'trendyol iade maliyeti hesaplama',
    'hepsiburada iade kargo ücreti',
    'iade zararı hesaplayıcı',
    'başa baş iade oranı',
    'break-even return rate',
    'e-ticaret kâr erimesi',
    'pazaryeri satıcı iade analizi',
    'gidiş dönüş kargo maliyeti',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/e-ticaret-iade-zarari-hesaplama',
  },
  openGraph: {
    title: 'E-Ticaret İade Zararı & Gerçek Kâr Marjı Hesaplama | Noktanyus',
    description:
      'Trendyol, Hepsiburada ve e-ticaret siteleri için iade oranı kaynaklı çift yönlü kargo ve amortisman zararını hesaplayarak başa baş iade sınırınızı keşfedin.',
    url: 'https://noktanyus.com/araclar/e-ticaret-iade-zarari-hesaplama',
  },
};

export default function ReturnLossPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'E-Ticaret İade Zararı & Gerçek Kâr Marjı Hesaplama Aracı',
    url: 'https://noktanyus.com/araclar/e-ticaret-iade-zarari-hesaplama',
    description:
      'Pazaryeri ve e-ticaret satıcıları için iade oranı kaynaklı kargo zararı, amortisman kaybı ve başa baş kârlılık limiti hesaplayıcı.',
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
      <ReturnLossToolClient />
    </>
  );
}
