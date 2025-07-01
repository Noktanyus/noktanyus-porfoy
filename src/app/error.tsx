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
    console.error(error);
  }, [error]);
 
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="text-3xl font-semibold mb-4">Bir şeyler ters gitti!</h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Uygulamada beklenmedik bir hata oluştu. Lütfen tekrar deneyin.
      </p>
      <button
        onClick={() => reset()}
        className="bg-brand-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
