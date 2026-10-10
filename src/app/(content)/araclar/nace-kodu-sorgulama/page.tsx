import { Metadata } from 'next';
import NaceToolClient from '@/components/tools/NaceToolClient';

export const metadata: Metadata = {
  title: 'Türkiye NACE Kodu & İSG Tehlike Sınıfı Rehberi | TOBB & SGK Faaliyet Kodları | Noktanyus',
  description:
    '6 haneli resmi NACE Rev.2 faaliyet kodu arama ve İSG tehlike sınıfı (Az Tehlikeli, Tehlikeli, Çok Tehlikeli) sorgulama aracı. Şirket kuruluşu, vergi levhası ve OSGB yükümlülükleri için güncel rehber.',
  keywords: [
    'nace kodu sorgulama',
    'nace kodu nedir',
    'isg tehlike sınıfları listesi',
    'yazılım nace kodu',
    'e-ticaret nace kodu',
    '6331 sayılı kanun tehlike sınıfı',
    'sgk nace kodu',
    'tobb faaliyet kodları',
    'türkiye api nace',
    'şirket kuruluşu nace',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/nace-kodu-sorgulama',
  },
  openGraph: {
    title: 'Türkiye NACE Kodu & İSG Tehlike Sınıfı Rehberi | Noktanyus',
    description:
      '6 haneli NACE faaliyet kodları ve 6331 sayılı Kanun İSG tehlike sınıfları sorgulama ve arama aracı.',
    url: 'https://noktanyus.com/araclar/nace-kodu-sorgulama',
  },
};

export default function NaceKoduSorgulamaPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Türkiye NACE Kodu & İSG Tehlike Sınıfı Rehberi',
    url: 'https://noktanyus.com/araclar/nace-kodu-sorgulama',
    description:
      '6 haneli NACE kodları ve İSG tehlike sınıfları sorgulama ve arama motoru.',
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
      <NaceToolClient />
    </>
  );
}
