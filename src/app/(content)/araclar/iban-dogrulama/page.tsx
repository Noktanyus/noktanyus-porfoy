import { Metadata } from 'next';
import IbanToolClient from '@/components/tools/IbanToolClient';

export const metadata: Metadata = {
  title: 'TR IBAN Doğrulama ve Banka Bulucu | Online Ücretsiz Araç',
  description:
    'Türkiye IBAN numarasını ISO 7064 Mod-97 algoritmasıyla anında doğrulayın, banka kodunu ve banka adını öğrenin. Ücretsiz ve API destekli.',
  keywords: [
    'iban doğrulama',
    'tr iban sorgulama',
    'iban banka bulma',
    'iban kontrolü',
    'iban checksum',
    'iban api',
  ],
  openGraph: {
    title: 'TR IBAN Doğrulama ve Banka Bulucu | Noktanyus',
    description: 'TR IBAN doğrulaması yapın, banka adını ve kodunu anında tespit edin.',
    url: 'https://noktanyus.com/araclar/iban-dogrulama',
  },
};

export default function IbanDogrulamaPage() {
  return <IbanToolClient />;
}
