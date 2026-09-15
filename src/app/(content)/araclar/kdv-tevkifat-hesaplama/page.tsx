import { Metadata } from 'next';
import KdvToolClient from '@/components/tools/KdvToolClient';

export const metadata: Metadata = {
  title: 'KDV ve Tevkifat Hesaplama Aracı | Net / Brüt ve Tevkifat Oranları',
  description:
    'Netten brüte veya brütten nete KDV hesaplayın. 2/10, 5/10, 7/10, 9/10 tevkifat oranları ile satıcıya ödenecek tutar ve KDV-2 beyan tutarlarını kuruş hassasiyetinde görün.',
  keywords: [
    'kdv hesaplama',
    'tevkifat hesaplama',
    'kdv tevkifatı',
    '5/10 tevkifat',
    'netten brüte kdv',
    'kdv hesap makinesi',
    'kdv api',
  ],
  openGraph: {
    title: 'KDV ve Tevkifat Hesaplama Aracı | Noktanyus',
    description: 'Netten brüte KDV ve resmi tevkifat oranları hesaplayıcı.',
    url: 'https://noktanyus.com/araclar/kdv-tevkifat-hesaplama',
  },
};

export default function KdvTevkifatPage() {
  return <KdvToolClient />;
}
