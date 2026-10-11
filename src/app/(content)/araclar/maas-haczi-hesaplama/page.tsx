import { Metadata } from 'next';
import SalaryGarnishmentToolClient from '@/components/tools/SalaryGarnishmentToolClient';

export const metadata: Metadata = {
  title: 'Maaş Haczi & İcra Sıra Cetveli Hesaplama | 2004 s. İİK m.83 | Noktanyus',
  description:
    '2004 sayılı İcra ve İflas Kanunu Madde 83 uyarınca net maaştan 1/4 yasal haciz kesintisi, öncelikli nafaka düşümü ve birden fazla icra dosyası için sıra cetveli bitiş projeksiyonu hesaplayıcı. Ücretsiz & API destekli.',
  keywords: [
    'maaş haczi hesaplama',
    'iik 83 maaş haczi kesinti oranı',
    'maaştan ne kadar icra kesilir',
    'icra sıra cetveli hesaplama',
    'nafaka maaş haczi önceliği',
    'ikramiyeden haciz kesintisi',
    'birden fazla icra kesintisi sırası',
    'işveren icra müzekkeresi sorumluluğu',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/maas-haczi-hesaplama',
  },
  openGraph: {
    title: 'Maaş Haczi & İcra Sıra Cetveli Hesaplama | Noktanyus',
    description:
      'Net maaştan 1/4 yasal haciz kesintisi, öncelikli nafaka düşümü ve icra sıra cetveli bitiş süresini hesaplayın.',
    url: 'https://noktanyus.com/araclar/maas-haczi-hesaplama',
  },
};

export default function SalaryGarnishmentPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Maaş Haczi & İcra Sıra Cetveli Hesaplama Aracı',
    url: 'https://noktanyus.com/araclar/maas-haczi-hesaplama',
    description:
      '2004 sayılı İİK m.83 uyarınca net maaştan 1/4 icra kesintisi, nafaka önceliği ve çoklu icra dosyası sıra cetveli hesaplayıcı.',
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
      <SalaryGarnishmentToolClient />
    </>
  );
}
