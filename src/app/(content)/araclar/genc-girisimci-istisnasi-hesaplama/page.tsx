import { Metadata } from 'next';
import YoungEntrepreneurToolClient from '@/components/tools/YoungEntrepreneurToolClient';

export const metadata: Metadata = {
  title: 'Genç Girişimci İstisnası & Bağkur Desteği Hesaplama | 193 s. GVK m.20/A | Noktanyus',
  description:
    '18-29 yaş arası şahıs şirketi açanlar için 3 yıllık gelir vergisi istisnası (230.000 TL / 330.000 TL) ve 1 yıllık SGK Bağkur prim desteğini hesaplayın. Vergi tasarrufunuzu ve net gelirinizi simüle edin.',
  keywords: [
    'genç girişimci istisnası hesaplama',
    'genç girişimci bağkur desteği',
    'genç girişimci vergi muafiyeti',
    '193 gvk mükerrer 20/a',
    'şahıs şirketi vergi hesaplama',
    'gelir vergisi dilimleri 2024',
    'genç girişimci ne kadar tasarruf sağlar',
    'freelancer vergi hesaplama',
    'yazılımcı şirket kuruluşu teşvikleri',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/genc-girisimci-istisnasi-hesaplama',
  },
  openGraph: {
    title: 'Genç Girişimci İstisnası & Bağkur Desteği Hesaplama | Noktanyus',
    description:
      '3 yıllık vergi istisnası ve 1 yıllık Bağkur prim desteği kazancınızı anında simüle edin. Ücretsiz & API destekli.',
    url: 'https://noktanyus.com/araclar/genc-girisimci-istisnasi-hesaplama',
  },
};

export default function YoungEntrepreneurPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Genç Girişimci İstisnası & Bağkur Desteği Hesaplama Aracı',
    url: 'https://noktanyus.com/araclar/genc-girisimci-istisnasi-hesaplama',
    description:
      '18-29 yaş arası genç girişimciler için 3 vergilendirme dönemi gelir vergisi istisnası ve SGK Bağkur desteği hesaplayıcı.',
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
      <YoungEntrepreneurToolClient />
    </>
  );
}
