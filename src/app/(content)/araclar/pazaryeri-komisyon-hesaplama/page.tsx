import { Metadata } from 'next';
import MarketplaceFeeToolClient from '@/components/tools/MarketplaceFeeToolClient';

export const metadata: Metadata = {
  title: 'Pazaryeri Komisyon & Net Kâr Hesaplama | Trendyol, Hepsiburada, Amazon, N11 | Noktanyus',
  description:
    'Trendyol, Hepsiburada, Amazon TR ve N11 kategori komisyon oranları, kargo barem ücretleri, KDV ve e-ticaret stopajı kesintileri ile ürün net kârı ve kâr marjı hesaplayıcı. Ücretsiz & API destekli.',
  keywords: [
    'trendyol komisyon hesaplama',
    'hepsiburada komisyon oranları',
    'pazaryeri kâr hesaplama',
    'amazon tr komisyon hesaplama',
    'n11 komisyon hesaplama',
    'e-ticaret kâr marjı',
    'trendyol kargo baremleri',
    'hepsiburada kargo ücreti',
    'e-ticaret stopaj hesaplama',
    'satıcı kâr hesaplayıcı',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/pazaryeri-komisyon-hesaplama',
  },
  openGraph: {
    title: 'Pazaryeri Komisyon & Net Kâr Hesaplama | Noktanyus',
    description:
      'Trendyol, Hepsiburada, Amazon TR ve N11 komisyon, kargo baremi ve net kâr hesaplama aracı. Güncel oranlarla ücretsiz hesaplayın.',
    url: 'https://noktanyus.com/araclar/pazaryeri-komisyon-hesaplama',
  },
};

export default function PazaryeriKomisyonPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Pazaryeri Komisyon & Net Kâr Hesaplama Aracı',
    url: 'https://noktanyus.com/araclar/pazaryeri-komisyon-hesaplama',
    description:
      'Trendyol, Hepsiburada, Amazon TR ve N11 platformları için komisyon, kargo, kesinti ve net kâr hesaplayıcı.',
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
      <MarketplaceFeeToolClient />
    </>
  );
}
