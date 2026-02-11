/**
 * @file 404 - Sayfa Bulunamadı bileşeni.
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold text-blue-600 dark:text-blue-500 mb-4 animate-bounce">404</h1>
      <h2 className="text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Sayfa Bulunamadı</h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        Aradığınız sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak kullanım dışı olabilir.
      </p>
      <Link
        href="/"
        className="bg-brand-primary text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
