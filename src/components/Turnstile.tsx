"use client";

import { useEffect, useRef, useCallback } from 'react';

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

const Turnstile = ({ sitekey, onVerify, onError, onExpire, ...props }: TurnstileProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

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

  const propsString = JSON.stringify(props);

  useEffect(() => {
    if (!ref.current || !sitekey) {
      if (!sitekey) console.error("Turnstile -> Hata: 'sitekey' prop'u eksik.");
      return;
    }

    const render = () => {
      if (ref.current && window.turnstile && !widgetId.current) {
        const id = window.turnstile.render(ref.current, {
          sitekey,
          callback: handleVerify,
          'expired-callback': handleExpire,
          'error-callback': handleError,
          ...props,
        });
        if (id) {
          widgetId.current = id;
        }
      }
    };

    let timeoutId: NodeJS.Timeout;
    const checkForTurnstile = () => {
      if (window.turnstile) {
        render();
      } else {
        timeoutId = setTimeout(checkForTurnstile, 100);
      }
    };

    checkForTurnstile();

    return () => {
      clearTimeout(timeoutId);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [sitekey, handleVerify, handleExpire, handleError, propsString, props]);

  return <div ref={ref} />;
};

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