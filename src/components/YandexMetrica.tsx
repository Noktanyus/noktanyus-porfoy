"use client";

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const YandexMetrica = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const yandexId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

  useEffect(() => {
    if (!yandexId) {
      return;
    }

    const url = `${pathname}?${searchParams}`;
    // @ts-ignore
    window.ym(yandexId, 'hit', url);
  }, [pathname, searchParams, yandexId]);

  if (!yandexId) {
    return null;
  }

  return (
    <Script id="yandex-metrica">
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
