import { Metadata } from 'next';
import TaxOfficeToolClient from '@/components/tools/TaxOfficeToolClient';

export const metadata: Metadata = {
  title: 'Türkiye Vergi Dairesi Kodları & Arama Motoru | GİB & e-Fatura Rehberi | Noktanyus',
  description:
    'GİB ve e-Fatura/e-Arşiv UBL-TR standartlarında 81 ilin resmi vergi dairesi kodları sorgulama ve arama aracı. İlçe ve müdürlük adı ile anında kod bulun, UBL XML parçacığını kopyalayın veya REST API ile sorgulayın.',
  keywords: [
    'vergi dairesi kodları',
    'vergi dairesi kodu sorgulama',
    'gib vergi daireleri listesi',
    'e-fatura vergi dairesi kodu',
    'ubl-tr partytaxscheme',
    'istanbul vergi daireleri kodları',
    'ankara vergi dairesi kodları',
    'izmir vergi dairesi kodları',
    'vergi kimlik numarası vergi dairesi',
    'türkiye api vergi dairesi',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/vergi-dairesi-kodlari',
  },
  openGraph: {
    title: 'Türkiye Vergi Dairesi Kodları & Arama Motoru | GİB & e-Fatura | Noktanyus',
    description:
      'GİB ve e-Fatura uyumlu vergi dairesi kodları arama motoru. 81 il müdürlükleri, kod kopyalama ve UBL-TR e-Fatura XML snippet desteği.',
    url: 'https://noktanyus.com/araclar/vergi-dairesi-kodlari',
  },
};

export default function VergiDairesiKodlariPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Türkiye Vergi Dairesi Kodları & Arama Motoru',
    url: 'https://noktanyus.com/araclar/vergi-dairesi-kodlari',
    description:
      'GİB ve e-Fatura standartlarında vergi dairesi kodları sorgulama ve UBL XML parçacığı üretici.',
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
      <TaxOfficeToolClient />
    </>
  );
}
