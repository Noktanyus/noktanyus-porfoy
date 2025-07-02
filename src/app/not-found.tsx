/**
 * @file 404 Hata Sayfası.
 * @description Bu bileşen, Next.js'in dosya tabanlı yönlendirme sisteminde
 *              karşılığı bulunamayan bir yola (URL) gidildiğinde otomatik
 *              olarak gösterilir. Kullanıcıya sayfanın bulunamadığını bildirir
 *              ve ana sayfaya dönmesi için bir link sunar.
 */

"use client"; // Bu bileşen interaktif olmasa da, Next.js'in App Router'ında
              // not-found.tsx dosyalarının istemci bileşeni olması beklenir.

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold text-brand-primary">404</h1>
      <h2 className="text-3xl font-semibold mt-4 mb-2">Sayfa Bulunamadı</h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        Aradığınız sayfa mevcut değil, taşınmış veya silinmiş olabilir. Lütfen adresi kontrol edin veya ana sayfaya dönün.
      </p>
      <Link href="/">
        <button className="bg-brand-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
          Ana Sayfaya Dön
        </button>
      </Link>
    </div>
  );
}
