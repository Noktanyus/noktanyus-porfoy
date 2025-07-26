
"use client";

/**
 * @file İletişim Sayfası (Client Bileşeni)
 * @description Bu sayfa, tamamen client-side çalışır. SSR sorunlarını önlemek
 *              için tüm veri çekme işlemleri client-side yapılır.
 */

import { useState, useEffect } from "react";
import Head from "next/head";
import IletisimForm from "./IletisimForm";
import { About } from "@/types/content";

export default function IletisimPage() {
  const [aboutData, setAboutData] = useState<About | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await fetch('/api/about');
        if (!response.ok) {
          throw new Error('Veri yüklenemedi');
        }
        const data = await response.json();
        setAboutData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Hata: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>İletişim | Portfolyo</title>
        <meta name="description" content="Benimle iletişime geçin. Projeleriniz, sorularınız veya iş birliği teklifleriniz için formu doldurun." />
      </Head>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-12">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white leading-tight px-2">
            İletişime Geçin
          </h1>
          <p className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2 sm:px-4 leading-relaxed">
            Bir sorunuz mu var, bir proje teklifiniz mi var, yoksa sadece merhaba mı demek istiyorsunuz? Aşağıdaki formu doldurmaktan çekinmeyin.
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <IletisimForm 
            contactEmail={aboutData?.contactEmail}
            socialGithub={aboutData?.socialGithub}
            socialLinkedin={aboutData?.socialLinkedin}
            socialInstagram={aboutData?.socialInstagram}
          />
        </div>
      </div>
    </>
  );
}
