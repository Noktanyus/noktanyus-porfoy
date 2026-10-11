import { Metadata } from 'next';
import CustomsTaxToolClient from '@/components/tools/CustomsTaxToolClient';

export const metadata: Metadata = {
  title: 'Yurt Dışı Alışveriş Gümrük Vergisi & 30 Avro Sınırı Hesaplama | Noktanyus',
  description:
    'Temu, AliExpress, Amazon siparişleri için Ağustos 2024 kararnamesi 30 € muafiyet sınırı, AB (%30) / Çin (%60) gümrük vergisi, ÖTV IV (%20) ve kapıda teslim toplam maliyet hesaplayıcı.',
  keywords: [
    'gümrük vergisi hesaplama',
    '30 euro sınırı',
    'temu gümrük vergisi hesaplama',
    'aliexpress gümrük vergisi',
    'yurt dışı alışveriş vergisi 2024',
    'çin gümrük vergisi yüzde 60',
    'avrupa birliği gümrük vergisi yüzde 30',
    'ötv 4 sayılı liste gümrük',
    'gümrük sunum ücreti',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/gumruk-vergisi-hesaplama',
  },
  openGraph: {
    title: 'Yurt Dışı Alışveriş Gümrük Vergisi & 30 Avro Sınırı Hesaplama | Noktanyus',
    description:
      'Temu, AliExpress ve yurt dışı siparişlerinizde 30 € sınırını kontrol edin, AB (%30) ve Çin (%60) gümrük vergisini ve son maliyeti anında hesaplayın.',
    url: 'https://noktanyus.com/araclar/gumruk-vergisi-hesaplama',
  },
};

export default function CustomsTaxPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Yurt Dışı Alışveriş Gümrük Vergisi ve 30 Avro Sınırı Hesaplama Motoru',
    url: 'https://noktanyus.com/araclar/gumruk-vergisi-hesaplama',
    description:
      '06 Ağustos 2024 Cumhurbaşkanı Kararı (8787) uyarınca 30 Avro muafiyet tavanı denetimi, AB/Çin maktu vergi ve ÖTV hesaplayıcı.',
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
      <CustomsTaxToolClient />
    </>
  );
}
