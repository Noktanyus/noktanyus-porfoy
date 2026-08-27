import "@/lib/env";
/**
 * @file Kök layout bileşeni.
 * @description Bu dosya, tüm sayfaları saran ana HTML yapısını oluşturur.
 *              `<html>` ve `<body>` etiketlerini içerir. Ayrıca, genel font ayarları,
 *              tema (açık/koyu mod) ve kimlik doğrulama sağlayıcıları gibi
 *              global context'leri ve script'leri (Yandex Metrica) tanımlar.
 */

import Image from "next/image";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
// Force dynamic rendering globally to prevent build-time Prisma errors
export const dynamicMode = 'force-dynamic';

import "./globals.css"; // Font importu artık bu dosyanın içinde
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthProvider from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import AnalyticsProvider from "@/components/providers/AnalyticsProvider";
import { getAbout, getSeoSettings } from "@/services/contentService";
import { Suspense } from 'react';
import Script from "next/script";
import Spinner from "@/components/ui/Spinner";
import dynamic from "next/dynamic";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

// next/font/google: build-time download & self-host Inter. Eliminates the
// runtime Google Fonts CSS request and removes a render-blocking resource.
// 'swap' avoids invisible text during font load (FOIT).
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
});

// Popup görüntüleyiciyi sadece istemci tarafında ve ihtiyaç anında yükle
const PopupViewer = dynamic(() => import('@/components/PopupViewer'), { ssr: false });

/**
 * Dinamik olarak sayfa metadata'sını (başlık, açıklama, SEO etiketleri) oluşturur.
 */
export async function generateMetadata(): Promise<Metadata> {
  let seo = null;
  try {
    seo = await getSeoSettings();
  } catch (e) {
    // SEO settings table may be empty — return safe defaults
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!seo) {
    return {
      title: "Portföy",
      description: "Kişisel portföy web sitesi.",
    };
  }

  const ogImageUrl = seo.ogImage && seo.ogImage.startsWith('http') ? seo.ogImage : `${baseUrl}${seo.ogImage}`;
  const twitterImageUrl = seo.twitterImage && seo.twitterImage.startsWith('http') ? seo.twitterImage : `${baseUrl}${seo.twitterImage}`;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: seo.siteTitle,
      template: `%s | ${seo.siteTitle}`,
    },
    description: seo.siteDescription,
    keywords: seo.siteKeywords,
    robots: seo.robots,
    alternates: {
      canonical: seo.canonicalUrl,
    },
    openGraph: {
      title: seo.ogTitle || seo.siteTitle,
      description: seo.ogDescription || seo.siteDescription,
      url: seo.ogUrl || seo.canonicalUrl,
      siteName: seo.ogSiteName || seo.siteTitle,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : [],
      locale: 'tr_TR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.twitterTitle || seo.siteTitle,
      description: seo.twitterDescription || seo.siteDescription,
      creator: seo.twitterCreator || undefined,
      images: twitterImageUrl ? [twitterImageUrl] : [],
    },
    icons: {
      icon: seo.favicon || "/favicon.ico",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let aboutData = null;
  try {
    aboutData = await getAbout();
  } catch (e) {
    // About data may not exist yet
  }
  const headerTitle = aboutData?.headerTitle || "Portföyüm";
  const yandexMetricaId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;
  const activeLocale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={activeLocale} suppressHydrationWarning>
      <head>
        {/*
          Browser extension polyfill + dev-only error filter.
          Production'da console.error bastırma YAPILMAZ — gerçek hataların
          görünür kalması gerekir. window.onerror filtresi yalnızca
          geliştirme ortamında aktiftir.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;

                // 1. Define a mock 'browser' object to prevent ReferenceError
                //    when browser extensions inject 'chrome.browser' API bekçileri.
                if (typeof window.browser === 'undefined') {
                  window.browser = {
                    runtime: {
                      onMessage: { addListener: () => {}, removeListener: () => {} },
                      sendMessage: () => Promise.resolve(),
                    }
                  };
                }

                // 2. Yalnızca development'ta belirli browser-extension scriptlerinin
                //    (myContent.js, pagehelper.js) sebep olduğu hataları bastır.
                //    Production'da tüm hatalar normal akışa bırakılır.
                if (process.env.NODE_ENV !== 'production') {
                  var problematicScripts = ['myContent.js', 'pagehelper.js'];
                  window.onerror = function(message, source) {
                    if (typeof source === 'string' && problematicScripts.some(function(script) { return source.indexOf(script) !== -1; })) {
                      return true;
                    }
                    return false;
                  };
                }
              })();
            `,
          }}
        />
        {/* Inter font is self-hosted via next/font/google — no external preconnects needed */}
      </head>
      {/* Apply next/font CSS variable + Tailwind classes. The `inter.variable`
          class wires the generated --font-inter custom property onto <html>. */}
      <body
        className={`${inter.variable} bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text`}
      >
        <NextIntlClientProvider locale={activeLocale} messages={messages}>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange={false}
            >
              <div className="relative flex flex-col min-h-screen">
                <Header headerTitle={headerTitle} />
                <main className="flex-grow w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-20 sm:pt-24 pb-8">
                  <div className="w-full">
                    {children}
                  </div>
                </main>
                <Footer aboutData={aboutData} />
              </div>
              <Suspense fallback={<Spinner />}>
                <PopupViewer />
              </Suspense>
            </ThemeProvider>
          </AuthProvider>
        </NextIntlClientProvider>
        
        {yandexMetricaId && (
          <Suspense fallback={null}>
            <Script id="yandex-metrica-init" strategy="afterInteractive">
              {`
                (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

                ym(${yandexMetricaId}, "init", {
                      clickmap:true,
                      trackLinks:true,
                      accurateTrackBounce:true,
                      webvisor:true
                });
              `}
            </Script>
            <noscript>
              <div>
                <Image src={`https://mc.yandex.ru/watch/${yandexMetricaId}`} style={{position:'absolute', left:'-9999px'}} alt="" width={1} height={1} />
              </div>
            </noscript>
          </Suspense>
        )}
      </body>
    </html>
  );
}
