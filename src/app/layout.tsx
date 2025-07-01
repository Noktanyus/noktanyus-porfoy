
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
import YandexMetrica from "@/components/YandexMetrica";
import dynamic from "next/dynamic";

const PopupViewer = dynamic(() => import('@/components/PopupViewer'), { ssr: false });

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const seo = getSeoSettings();
  return {
    title: seo.siteTitle,
    description: seo.siteDescription,
    keywords: seo.siteKeywords,
    robots: seo.robots,
    alternates: {
      canonical: seo.canonicalUrl,
    },
    openGraph: {
      title: seo.og.title,
      description: seo.og.description,
      url: seo.og.url,
      siteName: seo.og.site_name,
      images: [
        {
          url: seo.og.image,
          width: 1200,
          height: 630,
        },
      ],
      locale: 'tr_TR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.twitter.title,
      description: seo.twitter.description,
      creator: seo.twitter.creator,
      images: [seo.twitter.image],
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
  const aboutData = await getAboutData();
  const headerTitle = aboutData.headerTitle || "Portföyüm";

  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.className} bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text`}>
        <AuthProvider>
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
            <Suspense fallback={<Spinner />}>
              <PopupViewer />
            </Suspense>
          </ThemeProvider>
        </AuthProvider>
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
        <Suspense fallback={<Spinner size="small" />}>
          <YandexMetrica />
        </Suspense>
      </body>
    </html>
  );
}

