'use client';

/**
 * @file LocaleSwitcher bileşeni.
 * @description Header'da görünen ve kullanıcının diller arası geçiş yapmasını
 *              sağlayan açılır menü. next-intl `useLocale()` ile aktif dili alır
 *              ve usePathname üzerinden mevcut path'i koruyarak yeni locale
 *              ile değiştirir.
 */

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import { locales, localeLabels, type Locale } from '@/i18n/config';

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const switchTo = useCallback(
    (newLocale: Locale) => {
      // next-intl `as-needed` modunda default locale prefix'sizdir.
      // Mevcut path'in başında locale varsa kaldır, yoksa dokunma.
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length > 0 && (locales as readonly string[]).includes(segments[0])) {
        segments.shift();
      }
      const tail = segments.join('/');
      const isDefault = newLocale === (locales[0] as Locale);
      const newPath = isDefault
        ? `/${tail}`
        : `/${newLocale}${tail ? `/${tail}` : ''}`;
      router.push(newPath || '/');
      setOpen(false);
    },
    [pathname, router]
  );

  const code = (currentLocale as string | undefined)?.toUpperCase() ?? 'TR';

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? 'Dil menüsünü kapat' : 'Dil menüsünü aç'}
        title={localeLabels[currentLocale as Locale] ?? code}
        className="touch-target p-1.5 rounded-full hover:bg-brand-primary/10 transition-all duration-300 focus-ring inline-flex items-center justify-center min-w-[2.5rem]"
      >
        <span className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
          {code}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Dil seçimi"
          className="absolute right-0 mt-2 w-44 glass-card-premium z-50 overflow-hidden fade-in"
        >
          {locales.map((loc) => {
            const active = loc === currentLocale;
            return (
              <button
                key={loc}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => switchTo(loc)}
                className={`w-full text-left px-3 py-2.5 hover:bg-brand-primary/10 transition-colors flex items-center gap-2 text-sm min-h-[44px] ${
                  active
                    ? 'bg-brand-primary/10 font-semibold text-brand-primary'
                    : 'text-gray-800 dark:text-gray-200'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wide w-7 shrink-0">
                  {loc}
                </span>
                <span>{localeLabels[loc]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LocaleSwitcher;
