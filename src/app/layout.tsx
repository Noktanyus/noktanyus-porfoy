
/**
 * @file Kök layout bileşeni.
 * @description Bu dosya, tüm sayfaları saran ana HTML yapısını oluşturur.
 *              `<html>` ve `<body>` etiketlerini içerir. Ayrıca, genel font ayarları,
 *              tema (açık/koyu mod) ve kimlik doğrulama sağlayıcıları gibi
 *              global context'leri ve script'leri (Yandex Metrica, Turnstile) tanımlar.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthProvider from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { getAboutData, getSeoSettings } from "@/lib/content-parser";
import { Suspense } from 'react';
import Script from "next/script";
import Spinner from "@/components/ui/Spinner";
import dynamic from "next/dynamic";

// Popup görüntüleyiciyi sadece istemci tarafında ve ihtiyaç anında yükle
const PopupViewer = dynamic(() => import('@/components/PopupViewer'), { ssr: false });

// Google Fonts'tan Inter fontunu yükle
const inter = Inter({ subsets: ["latin"] });

/**
 * Dinamik olarak sayfa metadata'sını (başlık, açıklama, SEO etiketleri) oluşturur.
 * Bu fonksiyon, build sırasında çalışır ve `content/seo-settings.json` dosyasından
 * alınan verilere göre her sayfa için uygun meta etiketlerini üretir.
 */
export async function generateMetadata(): Promise<Metadata> {
  const seo = getSeoSettings();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  // Resim URL'lerinin mutlak olduğundan emin ol
  const ogImageUrl = seo.og.image.startsWith('http') ? seo.og.image : `${baseUrl}${seo.og.image}`;
  const twitterImageUrl = seo.twitter.image.startsWith('http') ? seo.twitter.image : `${baseUrl}${seo.twitter.image}`;

  return {
    title: {
      default: seo.siteTitle,
      template: `%s | ${seo.siteTitle}`, // Diğer sayfalarda "Sayfa Başlığı | Site Başlığı" formatını kullan
    },
    description: seo.siteDescription,
    keywords: seo.siteKeywords,
    robots: seo.robots,
    alternates: {
      canonical: seo.canonicalUrl,
    },
    openGraph: {
      title: seo.og.title || seo.siteTitle,
      description: seo.og.description || seo.siteDescription,
      url: seo.og.url || seo.canonicalUrl,
      siteName: seo.og.site_name || seo.siteTitle,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
        },
      ],
      locale: 'tr_TR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.twitter.title || seo.siteTitle,
      description: seo.twitter.description || seo.siteDescription,
      creator: seo.twitter.creator,
      images: [twitterImageUrl],
    },
    icons: {
      icon: seo.favicon,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Header'da gösterilecek başlığı al
  const aboutData = await getAboutData();
  const headerTitle = aboutData.headerTitle || "Portföyüm";
  const yandexMetricaId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.className} bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text`}>
        {/* NextAuth için oturum sağlayıcısı */}
        <AuthProvider>
          {/* Tema (açık/koyu mod) sağlayıcısı */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative flex flex-col min-h-screen">
              <Header headerTitle={headerTitle} />
              <main className="flex-grow container mx-auto px-4 pt-24">
                {children}
              </main>
              <Footer />
            </div>
            {/* Popup'ları göstermek için istemci tarafı bileşeni */}
            <Suspense fallback={<Spinner />}>
              <PopupViewer />
            </Suspense>
          </ThemeProvider>
        </AuthProvider>
        
        {/* Harici script'ler */}
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" async defer />
        
        {/* Yandex Metrica script'i (sadece ID tanımlıysa eklenir) */}
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
                <img src={`https://mc.yandex.ru/watch/${yandexMetricaId}`} style={{position:'absolute', left:'-9999px'}} alt="" />
              </div>
            </noscript>
          </Suspense>
        )}
      </body>
    </html>
  );
}

