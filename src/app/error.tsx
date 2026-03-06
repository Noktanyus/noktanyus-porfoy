"use client";

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Beklenmedik bir hata yakalandı:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="glass-card p-10 sm:p-14 flex flex-col items-center max-w-md">
        <div className="w-16 h-16 mb-6 rounded-full bg-red-100/80 dark:bg-red-900/30 backdrop-blur-sm flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
          Bir Şeyler Ters Gitti!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          Uygulamada beklenmedik bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        <button
          onClick={reset}
          className="bg-brand-primary text-white font-semibold py-3 px-8 rounded-full hover:bg-brand-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          Tekrar Deneyin
        </button>
      </div>
    </div>
  );
}
