
"use client";

/**
 * @file İletişim Sayfası (Client Bileşeni)
 * @description Bu sayfa, tamamen client-side çalışır. SSR sorunlarını önlemek
 *              için tüm veri çekme işlemleri client-side yapılır.
 */

import { useState, useEffect } from "react";
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
        <div className="flex justify-center">
          <div className="glass-card p-10 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Yükleniyor...</p>
          </div>
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
      <div className="section-header">
        <h1 className="section-title">İletişime Geçin</h1>
        <p className="section-subtitle">
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
  );
}
