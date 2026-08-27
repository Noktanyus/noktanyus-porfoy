'use client';

/**
 * @file ThemeToggle — view transition'lı açık/koyu tema değiştirici.
 * @description Sun/Moon ikonları arasında geçiş yapar ve değişimi
 *              View Transitions API üzerinden 300ms cross-fade ile
 *              animasyonlandırır (browser destekliyorsa).
 *              prefers-reduced-motion CSS tarafında handle edilir.
 *              Hydration mismatch önlemek için mount olmadan render edilmez.
 */

import { useThemeTransition } from '@/hooks/useThemeTransition';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  /** Ekstra className — parent layout hizalama için. */
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useThemeTransition();
  const [mounted, setMounted] = useState(false);

  // Hydration mismatch önlemek için mount sonrası render et
  useEffect(() => {
    setMounted(true);
  }, []);

  const baseClass = cn(
    'p-2 rounded-full',
    'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    'transition-all duration-300',
    'hover:scale-110',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    'inline-flex items-center justify-center',
    className
  );

  // Mount öncesi: skeleton placeholder (yumuşak geçiş için)
  if (!mounted) {
    return (
      <button
        type="button"
        className={baseClass}
        aria-label="Tema değiştir"
        disabled
        aria-hidden="true"
      >
        <span className="w-5 h-5 sm:w-6 sm:h-6 block" />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Açık temaya geç' : 'Karanlık temaya geç'}
      aria-pressed={isDark}
      className={baseClass}
    >
      {isDark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 dark:text-gray-300"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

export default ThemeToggle;
