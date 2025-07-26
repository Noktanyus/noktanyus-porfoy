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

  // Console filter global olarak çalışıyor, burada gerek yok

  // Script yükleme
  useEffect(() => {
    // Zaten yüklü mü kontrol et
    if (window.turnstile) {
      setIsScriptLoaded(true);
      return;
    }

    // Script zaten DOM'da var mı kontrol et
    const existingScript = document.querySelector('script[src*="turnstile"]');
    if (existingScript) {
      // Script var ama window.turnstile henüz hazır değil, bekle
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

    // Script'i yükle - sandbox hatalarını önlemek için farklı yaklaşım
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    
    // Sandbox hatalarını önlemek için script'e özel attributeler ekle
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');

    // Script yüklendiğinde kontrol et
    script.onload = () => {
      // Turnstile API'nin hazır olmasını bekle
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
      // Cleanup sadece component unmount olduğunda
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (error) {
          console.error('Turnstile widget kaldırılamadı:', error);
        }
      }
    };
  }, [onError]);

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
      // Container'ı temizle
      containerRef.current.innerHTML = '';

      const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
      if (!siteKey) {
        console.error('Turnstile site key bulunamadı');
        onError?.();
        return;
      }

      // Widget'ı render et - sandbox hatalarını minimize etmek için
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          console.log('Turnstile doğrulandı');
          onVerify(token);
        },
        appearance: 'always', // Widget'ı her zaman göster
        execution: 'render', // Render sırasında çalıştır
        'error-callback': (error: any) => {
          // Sandbox hatalarını tamamen görmezden gel
          const errorStr = error?.toString() || '';
          if (
            errorStr.includes('sandboxed') || 
            errorStr.includes('about:blank') ||
            errorStr.includes('allow-scripts')
          ) {
            return; // Sandbox hatalarını işleme
          }
          
          console.error('Turnstile hatası:', error);
          setIsRendered(false);
          widgetIdRef.current = null;
          onError?.();
        },
        'expired-callback': () => {
          console.log('Turnstile süresi doldu');
          setIsRendered(false);
widgetIdRef.current = null;
          onExpire?.();
        },
        theme,
        size,
        retry: 'auto',
        'retry-interval': 8000,
        // Sandbox hatalarını azaltmak için ek ayarlar
        'refresh-expired': 'auto',
        'refresh-timeout': 'auto'
      });

      setIsRendered(true);
      console.log('Turnstile widget render edildi:', widgetIdRef.current);

    } catch (error) {
      console.error('Turnstile render hatası:', error);
      onError?.();
    }
  }, [isScriptLoaded, onVerify, onError, onExpire, theme, size, isRendered]);

  return (
    <div 
      ref={containerRef} 
      className={`${className} fade-in scale-in`}
      style={{ minHeight: '65px' }} // Turnstile widget boyutu için
    />
  );
}