import { Metadata } from 'next';
import TebligatToolClient from '@/components/tools/TebligatToolClient';

export const metadata: Metadata = {
  title: 'Tebligat Süre Hesaplama | Noktanyus',
  description:
    'Tebliğ tarihinden itibaren takvim veya iş günü ile son günü hesaplayın. API: /api/v1/calendar/tebligat',
  alternates: {
    canonical: 'https://noktanyus.com/araclar/tebligat-suresi',
  },
  openGraph: {
    title: 'Tebligat Süre Hesaplama | Noktanyus',
    description: 'Ücretsiz tebligat saati + calendar API.',
    url: 'https://noktanyus.com/araclar/tebligat-suresi',
  },
};

export default function TebligatSuresiPage() {
  return <TebligatToolClient />;
}
