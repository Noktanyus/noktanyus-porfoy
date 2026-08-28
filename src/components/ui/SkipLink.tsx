'use client';

/**
 * SkipLink — Klavye kullanicilari icin "iceege gec" linki.
 *
 * Sayfanin en basinda, normal akista gorunmez (sr-only + -translate-y-full).
 * Tab ile focus geldiginda gorunur hale gelir ve #main-content'e atlar.
 *
 * Kullanim: layout.tsx'te <body> icinde ilk child olarak yerlestirilir.
 */

import { FOCUS_RING_STYLE, SKIP_LINK_LABEL, SKIP_TARGET_ID } from '@/lib/a11y';
import { cn } from '@/lib/utils';

export function SkipLink() {
  return (
    <a
      href={`#${SKIP_TARGET_ID}`}
      className={cn(
        // sr-only: ekran okuyucu okur, gorsel olarak yok
        'sr-only',
        // focus olunca ust satirinda sabit olarak gorun
        'focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100]',
        'focus:px-4 focus:py-2 focus:rounded-lg',
        'focus:bg-blue-600 focus:text-white focus:shadow-lg',
        'focus:no-underline',
        FOCUS_RING_STYLE,
        'transition-all'
      )}
    >
      {SKIP_LINK_LABEL}
    </a>
  );
}

export default SkipLink;