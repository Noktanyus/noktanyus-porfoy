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

export default function CloudflareTurnstile({
  onVerify,
  onError,
  onExpire,
  theme = 'light',
  size = 'normal',
  className = ''
}: CloudflareTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  // Script yükleme
  useEffect(() => {
    // Geliştirme modunda Turnstile'ı atla
    if (process.env.NODE_ENV === 'development') {
      console.log('Geliştirme modu: Turnstile atlandı.');
      onVerify('dev-mode-token'); // Sahte token ile doğrula
      return;
    }
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
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
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
      console.error('Turnstile script yüklenemedi');
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
    // Geliştirme modunda widget render etme
    if (process.env.NODE_ENV === 'development') {
      return;
    }
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

      const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
      if (!siteKey) {
        console.error('Turnstile site key bulunamadı');
        onError?.();
        return;
      }

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

  // Geliştirme modunda basit bir div döndür
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className={`${className} p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center`}>
        <p className="text-sm text-gray-600 dark:text-gray-400">Turnstile (Dev Mode)</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`${className} fade-in scale-in`}
      style={{ minHeight: '65px' }}
    />
  );
}