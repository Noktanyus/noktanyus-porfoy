'use client';

import { useEffect, useRef, useState } from 'react';

interface CloudflareTurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, options: any) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      ready?: (callback: () => void) => void;
    };
  }
}

// Cloudflare dummy testing sitekey (always passes)
const FALLBACK_TEST_SITE_KEY = '1x00000000000000000000AA';

export default function CloudflareTurnstile({
  onVerify,
  onError,
  onExpire,
  theme = 'light',
  size = 'normal',
  className = '',
}: CloudflareTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  // Script yükleme
  useEffect(() => {
    if (window.turnstile) {
      setIsScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="turnstile"]');
    if (existingScript) {
      const checkTurnstile = () => {
        if (window.turnstile) {
          setIsScriptLoaded(true);
        } else {
          setTimeout(checkTurnstile, 100);
        }
      };
      checkTurnstile();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');

    script.onload = () => {
      const waitForTurnstile = () => {
        if (window.turnstile) {
          setIsScriptLoaded(true);
        } else {
          setTimeout(waitForTurnstile, 50);
        }
      };
      waitForTurnstile();
    };

    script.onerror = () => {
      console.warn('[Turnstile] Script yüklenemedi — offline/test fallback');
      onVerify('dev-mode-token');
      onError?.();
    };

    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (error) {
          console.error('Turnstile widget kaldırılamadı:', error);
        }
      }
    };
  }, [onError, onVerify]);

  // Widget render etme
  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current || isRendered || widgetIdRef.current) {
      return;
    }

    if (!window.turnstile) {
      console.error('Turnstile API bulunamadı');
      onError?.();
      return;
    }

    try {
      containerRef.current.innerHTML = '';

      const siteKey =
        process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
        FALLBACK_TEST_SITE_KEY;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          onVerify(token);
        },
        'error-callback': () => {
          onError?.();
        },
        'expired-callback': () => {
          onExpire?.();
        },
        theme,
        size,
      });

      setIsRendered(true);
    } catch (error) {
      console.error('Turnstile render hatası:', error);
      onError?.();
    }
  }, [isScriptLoaded, onVerify, onError, onExpire, theme, size, isRendered]);

  return (
    <div
      ref={containerRef}
      className={`${className} fade-in scale-in flex justify-center`}
      style={{ minHeight: '65px' }}
      aria-label="Cloudflare Turnstile Güvenlik Doğrulaması"
    />
  );
}