import { Metadata } from 'next';
import CheckDiscountToolClient from '@/components/tools/CheckDiscountToolClient';

export const metadata: Metadata = {
  title: 'Çek & Senet Reeskont Faiz Hesaplama | VUK 238 & TCMB Oranları | Noktanyus',
  description:
    '213 sayılı VUK m.281/285 ve 238 nolu Tebliğ uyarınca iç iskonto / dış iskonto formülü ile çek ve senet reeskont hesaplama, portföy ağırlıklı ortalama vadesi ve Tekdüzen Hesap Planı yevmiye kaydı dökümü.',
  keywords: [
    'reeskont hesaplama',
    'çek reeskont hesaplama',
    'senet reeskont hesaplama',
    'iç iskonto formülü',
    'vuk 281 reeskont',
    'vuk 238 tebliği iç iskonto',
    'tcmb reeskont faiz oranı 2024',
    'ortalama vade hesaplama',
    '122 alacak senetleri reeskontu',
    '652 reeskont faiz gideri',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/cek-senet-reeskont-hesaplama',
  },
  openGraph: {
    title: 'Çek & Senet Reeskont Faiz Hesaplama Motoru | Noktanyus',
    description:
      'VUK m.281/285 iç iskonto formülü, TCMB reeskont oranları, ağırlıklı ortalama vade ve muhasebe fişi üretici.',
    url: 'https://noktanyus.com/araclar/cek-senet-reeskont-hesaplama',
  },
};

export default function CheckDiscountPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Çek & Senet Reeskont Faiz Hesaplama ve Ortalama Vade Motoru',
    url: 'https://noktanyus.com/araclar/cek-senet-reeskont-hesaplama',
    description:
      'Türkiye 213 sayılı VUK m.281 ve m.285 uyarınca iç iskonto reeskont hesaplayıcı, ağırlıklı gün hesabı ve THP yevmiye maddesi oluşturucu.',
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
      <CheckDiscountToolClient />
    </>
  );
}
