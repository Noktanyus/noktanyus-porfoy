'use client';

/**
 * @file useThemeTransition — view transition destekli tema değiştirme hook'u.
 * @description next-themes'in useTheme'ini sarmalar ve tema değişimini
 *              View Transitions API içine sarar. Desteklemeyen tarayıcılarda
 *              setTheme'i anında çağırır (graceful fallback).
 */

import { useTheme } from 'next-themes';
import { useCallback } from 'react';
import { startViewTransition } from '@/lib/viewTransitions';

interface UseThemeTransitionReturn {
  /** Şu anki aktif tema (system, light, dark olabilir). */
  theme: string | undefined;
  /** Çözümlenmiş tema (system ise systemTheme'a düşer). */
  resolvedTheme: string | undefined;
  setTheme: (theme: string) => void;
  /** View transition'lı tema değiştirici — dark ise light, light ise dark yapar. */
  toggleTheme: () => void;
}

export function useThemeTransition(): UseThemeTransitionReturn {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';

    startViewTransition(() => {
      setTheme(newTheme);
    });
  }, [resolvedTheme, setTheme]);

  return { theme, resolvedTheme, setTheme, toggleTheme };
}
