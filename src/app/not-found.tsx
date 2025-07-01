"use client";

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-brand-primary">404</h1>
      <h2 className="text-3xl font-semibold mt-4 mb-2">Sayfa Bulunamadı</h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link href="/">
        <button className="bg-brand-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
          Ana Sayfaya Dön
        </button>
      </Link>
    </div>
  );
}
