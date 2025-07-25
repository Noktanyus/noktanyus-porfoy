"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';

declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string | undefined;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  [key: string]: any;
}

interface TurnstileProps extends Omit<TurnstileOptions, 'callback' | 'error-callback' | 'expired-callback'> {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

const TurnstileWidget = ({ sitekey, onVerify, onError, onExpire, ...props }: TurnstileProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Development modunda localhost bypass kontrolü
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = mounted && typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const disableOnLocalhost = process.env.NEXT_PUBLIC_DISABLE_TURNSTILE_ON_LOCALHOST === 'true';
  const shouldBypass = isDevelopment && isLocalhost && disableOnLocalhost;
  
  // Callback'leri memoize et
  const handleVerify = useCallback((token: string) => {
    onVerify(token);
  }, [onVerify]);

  const handleExpire = useCallback(() => {
    onExpire?.();
    if (widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
    }
  }, [onExpire]);

  const handleError = useCallback(() => {
    onError?.();
  }, [onError]);
  
  // Development bypass için otomatik doğrulama
  useEffect(() => {
    if (mounted && shouldBypass && !isRendered) {
      const timer = setTimeout(() => {
        handleVerify('localhost-bypass-token');
        setIsRendered(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted, shouldBypass, isRendered, handleVerify]);
  
  // Turnstile render
  useEffect(() => {
    if (!mounted || shouldBypass || isRendered || !ref.current || !sitekey) {
      return;
    }

    const render = () => {
      if (ref.current && window.turnstile && !widgetId.current) {
        try {
          const id = window.turnstile.render(ref.current, {
            sitekey,
            callback: handleVerify,
            'expired-callback': handleExpire,
            'error-callback': handleError,
            theme: props.theme || 'auto',
          });
          if (id) {
            widgetId.current = id;
            setIsRendered(true);
          }
        } catch (error) {
          console.error('Turnstile render error:', error);
          handleError();
        }
      }
    };

    let timeoutId: NodeJS.Timeout;
    const checkForTurnstile = () => {
      if (typeof window !== 'undefined' && window.turnstile) {
        render();
      } else {
        timeoutId = setTimeout(checkForTurnstile, 100);
      }
    };

    checkForTurnstile();

    return () => {
      clearTimeout(timeoutId);
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch (error) {
          console.error('Turnstile cleanup error:', error);
        }
        widgetId.current = null;
        setIsRendered(false);
      }
    };
  }, [mounted, shouldBypass, isRendered, sitekey, handleVerify, handleExpire, handleError, props.theme]);
  
  if (!mounted) {
    return <div className="h-16 w-full max-w-[280px] sm:max-w-xs md:max-w-sm mx-auto bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />;
  }
  
  if (shouldBypass) {
    return (
      <div className="text-xs sm:text-sm text-gray-500 p-2 sm:p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center w-full max-w-[280px] sm:max-w-xs md:max-w-sm mx-auto min-h-[60px] sm:min-h-[65px] flex items-center justify-center">
        Geliştirme modu: Turnstile devre dışı
      </div>
    );
  }

  return <div ref={ref} className="min-h-[60px] sm:min-h-[65px] w-full max-w-[280px] sm:max-w-xs md:max-w-sm mx-auto flex justify-center items-center overflow-hidden" />;
};

// Dynamic import ile SSR sorunlarını önle
const Turnstile = dynamic(() => Promise.resolve(TurnstileWidget), {
  ssr: false,
  loading: () => <div className="h-16 w-full max-w-[280px] sm:max-w-xs md:max-w-sm mx-auto bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
});

export default Turnstile;

export const TurnstileScript = () => {
  useEffect(() => {
    const scriptId = 'cf-turnstile-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  return null;
};