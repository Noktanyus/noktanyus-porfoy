import { Metadata } from 'next';
import ToWordsToolClient from '@/components/tools/ToWordsToolClient';

export const metadata: Metadata = {
  title: 'Sayıyı Yazıya Çevir | Noktanyus',
  description:
    'Tutarı Türkçe yazıya çevirin (TRY/USD/EUR/GBP). Fatura ve çek metinleri için. API: /api/v1/finance/to-words',
  alternates: {
    canonical: 'https://noktanyus.com/araclar/sayiyi-yaziya',
  },
  openGraph: {
    title: 'Sayıyı Yazıya Çevir | Noktanyus',
    description: 'Ücretsiz tutar → yazı + finance API.',
    url: 'https://noktanyus.com/araclar/sayiyi-yaziya',
  },
};

export default function SayiyiYaziyaPage() {
  return <ToWordsToolClient />;
}
