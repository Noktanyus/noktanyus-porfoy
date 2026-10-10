import { Metadata } from 'next';
import UblViewerToolClient from '@/components/tools/UblViewerToolClient';

export const metadata: Metadata = {
  title: 'UBL e-Fatura & e-Arşiv XML Görüntüleyici ve Doğrulayıcı | GİB UBL-TR 2.1 | Noktanyus',
  description:
    'GİB UBL-TR 2.1 standartlarında e-Fatura ve e-Arşiv XML dosyalarını tarayıcınızda açın, zorunlu alanları denetleyin, şema hatalarını ayıklayın ve fatura özetini görselleştirin. Güvenli ve ücretsiz.',
  keywords: [
    'ubl fatura görüntüleyici',
    'e-fatura xml görüntüleyici',
    'e-arşiv xml okuyucu',
    'ubl xml validator',
    'gib e-fatura xml kontrol',
    'schematron doğrulama',
    'ubl 2.1 türkiye',
    'türkiye api ubl',
    'e-fatura şema hatası',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar/ubl-fatura-goruntuleyici',
  },
  openGraph: {
    title: 'UBL e-Fatura XML Görüntüleyici & Doğrulayıcı | Noktanyus',
    description:
      'GİB UBL-TR e-fatura ve e-arşiv XML dosyalarını anında açın, şema hatalarını yakalayın ve fatura özetini görüntüleyin.',
    url: 'https://noktanyus.com/araclar/ubl-fatura-goruntuleyici',
  },
};

export default function UblFaturaGoruntuleyiciPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'UBL e-Fatura XML Görüntüleyici ve Doğrulayıcı',
    url: 'https://noktanyus.com/araclar/ubl-fatura-goruntuleyici',
    description:
      'GİB standartlarında UBL-TR e-Fatura ve e-Arşiv XML şema doğrulayıcı ve ticari özet görüntüleyici.',
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
      <UblViewerToolClient />
    </>
  );
}
