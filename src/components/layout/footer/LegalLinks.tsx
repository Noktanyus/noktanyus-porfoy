'use client';

const LEGAL_LINKS = [
  { href: '/yasal/kvkk', label: 'KVKK' },
  { href: '/yasal/mesafeli-satis', label: 'Mesafeli Satış' },
  { href: '/yasal/cerez-politikasi', label: 'Çerez Politikası' },
  { href: '/yasal/cayma-hakki', label: 'Cayma Hakkı' },
  { href: '/yasal/gizlilik', label: 'Gizlilik' },
] as const;

/**
 * Footer yasal linkleri — tek veri kaynagi. nokta separator'lar
 * otomatik eklenir; ilk/son oge icin sol/sag kisitlamasi yok.
 */
export function LegalLinks() {
  return (
    <nav
      aria-label="Yasal bilgilendirme bağlantıları"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400"
    >
      {LEGAL_LINKS.map((link, i) => (
        <span key={link.href} className="inline-flex items-center gap-x-4">
          <a
            href={link.href}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            {link.label}
          </a>
          {i < LEGAL_LINKS.length - 1 && (
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
              ·
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
