import { Metadata } from 'next';
import PayrollToolClient from '@/components/tools/PayrollToolClient';

export const metadata: Metadata = {
  title: 'Brüt Net Maaş Hesaplama | Noktanyus',
  description:
    'SGK, işsizlik, damga ve gelir vergisi ile brütten nete / netten brüte maaş tahmini. API: /api/v1/labor/gross-to-net',
  alternates: {
    canonical: 'https://noktanyus.com/araclar/brut-net-maas',
  },
  openGraph: {
    title: 'Brüt Net Maaş Hesaplama | Noktanyus',
    description: 'Ücretsiz bordro tahmini + labor API.',
    url: 'https://noktanyus.com/araclar/brut-net-maas',
  },
};

export default function BrutNetMaasPage() {
  return <PayrollToolClient />;
}
