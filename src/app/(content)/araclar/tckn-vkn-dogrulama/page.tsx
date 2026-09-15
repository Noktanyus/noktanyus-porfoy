import { Metadata } from 'next';
import TcknVknToolClient from '@/components/tools/TcknVknToolClient';

export const metadata: Metadata = {
  title: 'TCKN ve VKN Algoritma Doğrulama Aracı | Online Ücretsiz',
  description:
    '11 haneli T.C. Kimlik Numarası ve 10 haneli Vergi Kimlik Numarası biçimsel ve matematiksel sağlama kontrolü. Ücretsiz e-ticaret ve fatura aracı.',
  keywords: [
    'tckn doğrulama',
    'vkn doğrulama',
    'tc kimlik kontrolü',
    'vergi kimlik no doğrulama',
    'tckn algoritması',
    'tckn api',
  ],
  openGraph: {
    title: 'TCKN ve VKN Algoritma Doğrulama Aracı | Noktanyus',
    description: 'TCKN ve VKN matematiksel format kontrolü ve algoritma doğrulaması.',
    url: 'https://noktanyus.com/araclar/tckn-vkn-dogrulama',
  },
};

export default function TcknVknPage() {
  return <TcknVknToolClient />;
}
