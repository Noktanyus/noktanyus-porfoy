'use client';

/**
 * ThemeCustomizer — Tema + accent renk secici.
 *
 * Kullanicinin tema (light/dark/system) ve accent (blue/purple/green/orange/pink)
 * tercihlerini degistirmesini saglar. Auth gerektirmez — guest kullanicilar icin
 * sadece localStorage'a yazilir, login olan kullanicilar icin API'ye de senkronize edilir.
 *
 * Hydration: mount sonrasi render edilir (next-themes entegrasyonu).
 */

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { FaPalette } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import {
  ACCENT_COLORS,
  THEME_OPTIONS,
  applyAccentToDocument,
  type AccentColor,
  type ThemeOption,
  isAccentColor,
} from '@/lib/theme';

interface ThemeCustomizerProps {
  className?: string;
}

export function ThemeCustomizer({ className }: ThemeCustomizerProps) {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [accent, setAccent] = useState<AccentColor>('blue');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Hydration guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // Read accent from document on mount (ThemeProvider tarafindan set edilir)
  useEffect(() => {
    if (!mounted) return;
    const stored = document.documentElement.dataset.accent;
    setAccent(isAccentColor(stored) ? stored : 'blue');
  }, [mounted]);

  // Click-outside to close dropdown
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Theme change handler — local + (logged in) remote persist
  const handleThemeChange = async (next: ThemeOption) => {
    setTheme(next);
    if (session?.user) {
      await persistPreferences({ theme: next });
    }
  };

  // Accent change handler — local + (logged in) remote persist
  const handleAccentChange = async (next: AccentColor) => {
    setAccent(next);
    applyAccentToDocument(next);
    if (session?.user) {
      await persistPreferences({ accentColor: next });
    }
  };

  const persistPreferences = async (payload: Record<string, string>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        // Silent — tema/accent zaten local olarak uygulandi.
        // Kullanici sonraki sayfada tekrar deneyebilir.
        // Loglama sadece debug icin.
        // eslint-disable-next-line no-console
        console.warn('Preferences persist failed', res.status);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Preferences persist network error', err);
    } finally {
      setSaving(false);
    }
  };

  const baseClass = cn(
    'p-2 rounded-full',
    'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    'transition-all duration-300',
    'hover:scale-110',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    'inline-flex items-center justify-center',
    className
  );

  if (!mounted) {
    return (
      <button
        type="button"
        className={baseClass}
        aria-label="Tema ve renk özelleştirici"
        disabled
        aria-hidden="true"
      >
        <span className="w-5 h-5 sm:w-6 sm:h-6 block" />
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Tema ve renk özelleştirici"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={baseClass}
      >
        <FaPalette className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Tema ve accent rengi seçimi"
          className="absolute right-0 mt-2 w-72 rounded-xl bg-white/95 dark:bg-black/95 border border-white/40 dark:border-black/40 shadow-xl backdrop-blur-md p-4 z-50 fade-in"
        >
          {/* Theme section */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Tema
            </h3>
            <div role="radiogroup" aria-label="Tema seçimi" className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((opt) => {
                const selected = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => handleThemeChange(opt.value as ThemeOption)}
                    disabled={saving}
                    title={opt.description}
                    className={cn(
                      'px-2 py-2 rounded-lg text-xs font-medium border transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                      selected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent section */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Vurgu Rengi
            </h3>
            <div role="radiogroup" aria-label="Accent rengi seçimi" className="flex gap-2">
              {ACCENT_COLORS.map((c) => {
                const selected = accent === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${c.label} rengi`}
                    onClick={() => handleAccentChange(c.value as AccentColor)}
                    disabled={saving}
                    className={cn(
                      'w-9 h-9 rounded-full transition-all',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                      selected ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'
                    )}
                    style={{
                      backgroundColor: c.hex,
                      // Tailwind ring color can't be dynamic — inline kullanildi
                      boxShadow: selected ? `0 0 0 2px ${c.hex}` : undefined,
                    }}
                  >
                    <span className="sr-only">{c.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {ACCENT_COLORS.find((c) => c.value === accent)?.label ?? 'Mavi'}
              {session?.user ? ' — kaydedildi' : ' — bu cihazda'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeCustomizer;