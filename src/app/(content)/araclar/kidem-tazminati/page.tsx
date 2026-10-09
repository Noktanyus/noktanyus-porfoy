import { Metadata } from 'next';
import SeveranceToolClient from '@/components/tools/SeveranceToolClient';

export const metadata: Metadata = {
  title: 'Kıdem Tazminatı Hesaplama | Noktanyus',
  description:
    '4857 kıdem ve ihbar tazminatı tahmini — tavan, damga vergisi, hizmet yılı. API: /api/v1/labor/severance',
  alternates: {
    canonical: 'https://noktanyus.com/araclar/kidem-tazminati',
  },
  openGraph: {
    title: 'Kıdem Tazminatı Hesaplama | Noktanyus',
    description: 'Ücretsiz kıdem/ihbar tahmini + labor API.',
    url: 'https://noktanyus.com/araclar/kidem-tazminati',
  },
};

export default function KidemTazminatiPage() {
  return <SeveranceToolClient />;
}
