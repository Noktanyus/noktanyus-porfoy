import { Metadata } from 'next';
import OvertimeToolClient from '@/components/tools/OvertimeToolClient';

export const metadata: Metadata = {
  title: 'Fazla Mesai ve Yıllık İzin Hesaplama | Noktanyus',
  description:
    '4857 sayılı İş Kanunu’na göre fazla çalışma ücreti ve yıllık izin gün hakkı. API: /api/v1/labor/overtime',
  alternates: { canonical: 'https://noktanyus.com/araclar/fazla-mesai-izin' },
};

export default function FazlaMesaiIzinPage() {
  return <OvertimeToolClient />;
}
