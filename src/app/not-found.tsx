import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="glass-card p-10 sm:p-14 flex flex-col items-center max-w-md">
        <div className="relative mb-6">
          <h1 className="text-8xl sm:text-9xl font-extrabold bg-gradient-to-br from-brand-primary to-purple-600 bg-clip-text text-transparent select-none">
            404
          </h1>
          <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-br from-brand-primary to-purple-600 rounded-full" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 dark:text-white">
          Sayfa Bulunamadı
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          Aradığınız sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak kullanım dışı olabilir.
        </p>
        <Link
          href="/"
          className="bg-brand-primary text-white font-semibold py-3 px-8 rounded-full hover:bg-brand-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
