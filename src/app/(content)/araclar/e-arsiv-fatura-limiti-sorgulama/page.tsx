import { Metadata } from 'next';
import EArchiveRulesToolClient from '@/components/tools/EArchiveRulesToolClient';

export const metadata: Metadata = {
  title: 'GİB e-Arşiv Fatura Limiti & KDV İstisna Kodları Rehberi | 509 s. VUK | Noktanyus',
  description:
    '509 Sıra No’lu VUK Genel Tebliği uyarınca fatura tutarına göre e-Arşiv portal zorunluluk limiti (5.000 TL vergi mükellefleri / 3.000 TL nihai tüketiciler) ve resmi UBL-TR KDV istisna/muafiyet kodları rehberi. Ücretsiz & API destekli.',
  keywords: [
    'e-arşiv fatura limiti 2024',
    'e-arşiv fatura zorunluluk sınırı',
    '5000 tl fatura e-arşiv zorunluluğu',
    '3000 tl fatura sınırı',
    'kdv istisna kodları',
    '301 mal ihracatı',
    '302 hizmet ihracatı',
    'e-fatura istisna muafiyet kodu',
    'vuk 509 e-arşiv tebliği',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/e-arsiv-fatura-limiti-sorgulama',
  },
  openGraph: {
    title: 'GİB e-Arşiv Fatura Limiti & KDV İstisna Kodları Rehberi | Noktanyus',
    description:
      'Fatura tutarınıza göre 5.000 TL / 3.000 TL e-Arşiv zorunluluğunu sorgulayın, resmi KDV istisna muafiyet kodlarını arayın.',
    url: 'https://noktanyus.com/araclar/e-arsiv-fatura-limiti-sorgulama',
  },
};

export default function EArchiveRulesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'GİB e-Arşiv Fatura Limiti & KDV İstisna Kodları Rehberi',
    url: 'https://noktanyus.com/araclar/e-arsiv-fatura-limiti-sorgulama',
    description:
      '509 Sıra No’lu VUK Genel Tebliği e-Arşiv fatura kesme zorunluluk limiti ve KDV muafiyet kodları sorgulayıcı.',
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
      <EArchiveRulesToolClient />
    </>
  );
}
