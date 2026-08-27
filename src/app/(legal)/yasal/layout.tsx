import { Metadata } from 'next';

/**
 * @file Yasal Sayfalar Ortak Layout
 * @description KVKK, Mesafeli Satış Sözleşmesi, Çerez Politikası,
 *              Cayma Hakkı ve Gizlilik Politikası sayfalarını kapsayan
 *              ortak layout bileşeni. Header/Footer kök layout'tan gelir.
 */

export const metadata: Metadata = {
  title: 'Yasal Bilgilendirme',
  description:
    'KVKK aydınlatma metni, mesafeli satış sözleşmesi, çerez politikası, cayma hakkı ve gizlilik politikası.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function YasalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-4xl mx-auto py-8 sm:py-12">
      {children}
    </article>
  );
}
