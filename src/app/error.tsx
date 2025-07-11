/**
 * @file Uygulama genelinde beklenmedik hataları yakalayan ve kullanıcıya bir hata arayüzü gösteren bileşen.
 * @description Bu dosya, Next.js'in dosya tabanlı hata yakalama mekanizmasının bir parçasıdır.
 *              Bir hata oluştuğunda, bu bileşen render edilir ve kullanıcıya hatayı
 *              bildirirken, geliştirici konsoluna hatanın detaylarını loglar.
 *              Ayrıca, kullanıcıya işlemi yeniden deneme seçeneği sunar.
 */

"use client"; // Hata bileşenleri istemci tarafında çalışmalıdır.

import { useEffect } from 'react';
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }; // Hata nesnesi, Next.js tarafından eklenen 'digest' içerebilir.
  reset: () => void; // Hata sınırını sıfırlayıp yeniden render etmeyi deneyen fonksiyon.
}) {
  
  // Hata oluştuğunda, geliştiricinin görmesi için hatayı konsola yazdır.
  useEffect(() => {
    console.error("Beklenmedik bir hata yakalandı:", error);
  }, [error]);
 
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-3xl font-semibold mb-4 text-red-600 dark:text-red-500">
        Bir Şeyler Ters Gitti!
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        Uygulamada beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin veya aşağıdaki butonu kullanarak sayfayı yenilemeyi deneyin.
      </p>
      <button
        onClick={
          // Hata sınırını sıfırlayarak yeniden render etmeyi dene.
          () => reset()
        }
        className="bg-brand-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Tekrar Deneyin
      </button>
    </div>
  );
}
