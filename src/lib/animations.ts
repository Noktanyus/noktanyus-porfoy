/**
 * @file animations - Tutarlı animasyon varyantları ve yardımcı hook'lar.
 *
 * Framer Motion ile kullanılan variant objeleri ve IntersectionObserver
 * tabanlı useInView hook'u burada toplanır. Tutarlı tipografi,
 * stagger ve giriş animasyonları için tek kaynak.
 */

'use client';

import { useEffect, useRef, useState, RefObject } from 'react';
import type { Variants } from 'framer-motion';

/* -------------------------------------------------------------------------- */
/*                              useInView hook                                */
/* -------------------------------------------------------------------------- */

interface UseInViewOptions extends IntersectionObserverInit {
  /** Bir kere true olduktan sonra tekrar false'a dusmez. Default: true */
  triggerOnce?: boolean;
}

/**
 * IntersectionObserver tabanlı görünürlük hook'u.
 * Component mount olduğunda observer başlar, element ilk defa görünür
 * olduğunda `inView = true` döner (varsayılan).
 *
 * Davranış:
 *   - IntersectionObserver yoksa (eski tarayıcı / SSR) → inView=true fallback
 *   - ref henüz bağlanmamışsa → inView=false (observer mount sonrası kurulacak)
 *
 * @example
 *   const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });
 *   return <div ref={ref}>{inView && <VisibleContent />}</div>;
 */
export function useInView<T extends HTMLElement = HTMLElement>(
  options: UseInViewOptions = {},
): { ref: RefObject<T>; inView: boolean } {
  const { triggerOnce = true, threshold = 0.1, root, rootMargin } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      // Eski tarayıcı / SSR — observer yoksa içeriği doğrudan göster
      setInView(true);
      return;
    }

    const el = ref.current;
    if (!el) return; // ref henüz bağlanmamış, sessizce geç

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setInView(false);
        }
      },
      {
        threshold,
        root: root ?? null,
        rootMargin: rootMargin ?? '0px',
      },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [triggerOnce, threshold, root, rootMargin]);

  return { ref, inView };
}

/* -------------------------------------------------------------------------- */
/*                          Framer Motion variants                            */
/* -------------------------------------------------------------------------- */

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
