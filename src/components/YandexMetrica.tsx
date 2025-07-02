/**
 * @file Yandex Metrica izleme kodunu ve sayfa görüntüleme takibini yöneten bileşen.
 * @description Bu bileşen, Yandex Metrica'nın izleme script'ini siteye ekler ve
 *              Next.js router'daki sayfa değişikliklerini dinleyerek her sayfa
 *              görüntülemesini Yandex'e bildirir.
 */

"use client";

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

// Yandex Metrica'nın `window` nesnesine eklediği `ym` fonksiyonu için tip tanımı.
declare global {
  interface Window {
    ym: (id: number, event: string, url?: string) => void;
  }
}

const YandexMetrica = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const yandexId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

  // Sayfa URL'si her değiştiğinde Yandex Metrica'ya 'hit' (sayfa görüntüleme) gönderir.
  useEffect(() => {
    if (!yandexId) {
      return;
    }

    const url = `${pathname}?${searchParams}`;
    
    try {
      // window.ym fonksiyonunun var olup olmadığını kontrol et
      if (window.ym) {
        window.ym(Number(yandexId), 'hit', url);
      }
    } catch (error) {
      console.error("YandexMetrica -> Hata: Sayfa görüntülemesi (hit) gönderilirken bir sorun oluştu.", error);
    }
  }, [pathname, searchParams, yandexId]);

  // Yandex ID'si .env.local dosyasında tanımlı değilse, bileşeni hiç render etme.
  if (!yandexId) {
    return null;
  }

  return (
    <Script id="yandex-metrica" strategy="afterInteractive">
      {`
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

        ym(${yandexId}, "init", {
              clickmap:true,
              trackLinks:true,
              accurateTrackBounce:true,
              webvisor:true
        });
      `}
    </Script>
  );
};

export default YandexMetrica;
