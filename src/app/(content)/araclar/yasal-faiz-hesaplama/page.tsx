import { Metadata } from 'next';
import LegalInterestToolClient from '@/components/tools/LegalInterestToolClient';

export const metadata: Metadata = {
  title: 'TCMB Yasal & Ticari Temerrüt Faizi Hesaplama | 3095 s.K. & TTK m.1530 | Noktanyus',
  description:
    '3095 Sayılı Kanun ve TTK m.1530 uyarınca TCMB ticari temerrüt faizi ve yasal kanuni faiz hesaplayıcı. İki tarih arasındaki Resmi Gazete kademeli faiz oranları dökümü. Ücretsiz & API destekli.',
  keywords: [
    'yasal faiz hesaplama',
    'ticari temerrüt faizi hesaplama',
    'ttk 1530 faiz oranı',
    '3095 sayılı kanun yasal faiz',
    'tcmb reeskont avans faizi',
    'gecikme faizi hesaplama',
    'icra faizi hesaplama',
    'kademeli faiz hesaplama',
    'türkiye api yasal faiz',
    'fatura gecikme faizi',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/yasal-faiz-hesaplama',
  },
  openGraph: {
    title: 'TCMB Yasal & Ticari Temerrüt Faizi Hesaplama | Noktanyus',
    description:
      'Resmi Gazete kademeli oranlarıyla gün bazında yasal faiz ve TTK 1530 ticari temerrüt faizi hesaplama aracı.',
    url: 'https://noktanyus.com/araclar/yasal-faiz-hesaplama',
  },
};

export default function YasalFaizHesaplamaPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TCMB Yasal & Ticari Temerrüt Faizi Hesaplama Aracı',
    url: 'https://noktanyus.com/araclar/yasal-faiz-hesaplama',
    description:
      '3095 Sayılı Kanun ve TTK m.1530 uyarınca kademeli faiz hesaplayıcı.',
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
      <LegalInterestToolClient />
    </>
  );
}
