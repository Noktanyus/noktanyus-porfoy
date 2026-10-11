import { Metadata } from 'next';
import SgkIncentiveToolClient from '@/components/tools/SgkIncentiveToolClient';

export const metadata: Metadata = {
  title: 'SGK %5 Puan Teşviki & İşveren Maliyeti Hesaplama | 5510 s.K. m.81/ı | Noktanyus',
  description:
    '5510 sayılı Kanun m.81/ı uyarınca özel sektör işveren hissesinden 5 puanlık Hazine prim indirimi (%20.5 → %15.5), 700 TL asgari ücret desteği ve şirket bordro tasarrufu hesaplayıcı ve cURL / REST API.',
  keywords: [
    'sgk teşvik hesaplama',
    '5510 5 puan indirimi',
    'sgk 5 puan teşviki',
    'işveren maliyeti hesaplama 2024',
    'asgari ücret desteği 700 tl',
    'sgk işveren hissesi 5 puan',
    '5510 kanun numarası',
    'bordro teşvik hesaplama',
    'sgk prim indirimi şartları',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/sgk-tesvik-hesaplama',
  },
  openGraph: {
    title: 'SGK %5 Puan Hazine Teşviki & İşveren Maliyeti Hesaplama | Noktanyus',
    description:
      '5510 sayılı Kanun 5 puanlık Hazine prim desteği (%20.5 → %15.5), 700 TL asgari ücret desteği ve şirketinizin net bordro tasarrufunu hesaplayın.',
    url: 'https://noktanyus.com/araclar/sgk-tesvik-hesaplama',
  },
};

export default function SgkIncentivePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'SGK %5 Puan Hazine Teşviki & İşveren Maliyeti Hesaplama Motoru',
    url: 'https://noktanyus.com/araclar/sgk-tesvik-hesaplama',
    description:
      '5510 sayılı Sosyal Sigortalar ve GSS Kanunu m.81/ı uyarınca 5 puanlık prim indirimi, 700 TL asgari ücret desteği ve işveren toplam maliyet hesaplayıcı.',
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
      <SgkIncentiveToolClient />
    </>
  );
}
