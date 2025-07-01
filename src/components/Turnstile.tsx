"use client";

import { useEffect, useRef } from 'react';

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

interface TurnstileProps extends TurnstileOptions {
  onVerify: (token: string) => void;
}

const Turnstile = ({ sitekey, onVerify, ...props }: TurnstileProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>();

  useEffect(() => {
    const renderTurnstile = () => {
      if (ref.current && window.turnstile) {
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey,
          callback: (token) => onVerify(token),
          ...props,
        });
      }
    };

    const interval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(interval);
        renderTurnstile();
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (widgetId.current) {
        window.turnstile.remove(widgetId.current);
      }
    };
  }, [sitekey, onVerify, props]);

  return <div ref={ref} />;
};

export default Turnstile;
