/**
 * @file Cloudflare Turnstile (CAPTCHA alternatifi) için bir React sarmalayıcı bileşeni.
 * @description Bu bileşen, Cloudflare'in Turnstile script'ini yükler, bir widget oluşturur
 *              ve doğrulama başarılı olduğunda bir callback fonksiyonunu tetikler.
 */

"use client";

import { useEffect, useRef } from 'react';

// Turnstile script'inin `window` nesnesine eklediği global tipleri tanımlar.
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

/** Turnstile widget'ı için yapılandırma seçenekleri. */
interface TurnstileOptions {
  /** Cloudflare panelinden alınan site anahtarı. */
  sitekey: string;
  /** Doğrulama başarılı olduğunda çağrılan fonksiyon. */
  callback?: (token: string) => void;
  /** Bir hata oluştuğunda çağrılan fonksiyon. */
  'error-callback'?: () => void;
  /** Token süresi dolduğunda çağrılan fonksiyon. */
  'expired-callback'?: () => void;
  /** Widget teması. */
  theme?: 'light' | 'dark' | 'auto';
  /** Diğer tüm ek parametreler. */
  [key: string]: any;
}

/** Bileşenin alacağı proplar. */
interface TurnstileProps extends Omit<TurnstileOptions, 'callback'> {
  /** Doğrulama başarılı olduğunda token'ı üst bileşene ileten fonksiyon. */
  onVerify: (token: string) => void;
}

const Turnstile = ({ sitekey, onVerify, ...props }: TurnstileProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>();

  useEffect(() => {
    if (!sitekey) {
      console.error("Turnstile -> Hata: 'sitekey' prop'u eksik. Lütfen bileşene bir sitekey sağlayın.");
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const renderWidget = () => {
      if (ref.current && window.turnstile) {
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey,
          callback: (token) => onVerify(token),
          ...props,
        });
      }
    };

    // Turnstile script'inin yüklenmesini bekle.
    // Script genellikle hızlı yüklenir, ancak yavaş bağlantılar için bir bekleme mekanizması gerekir.
    const checkForTurnstile = () => {
      if (window.turnstile) {
        renderWidget();
      } else {
        // Script henüz yüklenmediyse, kısa bir süre sonra tekrar dene.
        timeoutId = setTimeout(checkForTurnstile, 100);
      }
    };

    checkForTurnstile();

    // Bileşen DOM'dan kaldırıldığında (unmount) zamanlayıcıyı ve widget'ı temizle.
    // Bu, bellek sızıntılarını ve gereksiz işlemleri önler.
    return () => {
      clearTimeout(timeoutId);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
    };
  }, [sitekey, onVerify, props]);

  return <div ref={ref} />;
};

export default Turnstile;