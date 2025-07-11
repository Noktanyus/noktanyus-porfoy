"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { SeoSettings } from "@prisma/client";
import { useEffect } from "react";
import Link from "next/link";

type SeoFormData = Omit<SeoSettings, 'siteKeywords'> & {
  siteKeywords: string;
  robotsTxt: string;
};

export default function SeoForm({ settings, robotsTxt }: { settings: SeoSettings, robotsTxt: string }) {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting, errors } } = useForm<SeoFormData>({
    defaultValues: {
      siteTitle: settings?.siteTitle || '',
      siteDescription: settings?.siteDescription || '',
      siteKeywords: (settings?.siteKeywords || []).join(', '),
      canonicalUrl: settings?.canonicalUrl || '',
      robots: settings?.robots || 'index, follow',
      favicon: settings?.favicon || '/favicon.ico',
      ogTitle: settings?.ogTitle || '',
      ogDescription: settings?.ogDescription || '',
      ogImage: settings?.ogImage || '',
      ogType: 'website',
      ogUrl: settings?.ogUrl || '',
      ogSiteName: settings?.ogSiteName || '',
      twitterCard: 'summary_large_image',
      twitterSite: settings?.twitterSite || '',
      twitterCreator: settings?.twitterCreator || '',
      twitterTitle: settings?.twitterTitle || '',
      twitterDescription: settings?.twitterDescription || '',
      twitterImage: settings?.twitterImage || '',
      robotsTxt: robotsTxt || ''
    }
  });

  

  const onSubmit = async (data: SeoFormData) => {
    const loadingToast = toast.loading("Ayarlar güncelleniyor...");
    
    const processedData: Omit<SeoSettings, 'id'> = {
      ...data,
      siteKeywords: data.siteKeywords.split(',').map(k => k.trim()).filter(Boolean),
    };

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'seo',
          data: processedData,
        }),
      });

      if (!response.ok) throw new Error("İşlem başarısız oldu.");

      toast.success("Ayarlar güncellendi!", { id: loadingToast });
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message, { id: loadingToast });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* General SEO Settings */}
      <div className="p-6 border rounded-lg bg-white dark:bg-dark-card">
        <h2 className="text-xl font-semibold mb-4">Genel SEO Ayarları</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="siteTitle" className="block text-sm font-medium mb-1">Site Başlığı</label>
            <input {...register("siteTitle", { required: "Zorunlu alan" })} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="siteDescription" className="block text-sm font-medium mb-1">Site Açıklaması</label>
            <textarea {...register("siteDescription")} rows={3} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="siteKeywords" className="block text-sm font-medium mb-1">Anahtar Kelimeler (virgülle ayırın)</label>
            <input {...register("siteKeywords")} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="canonicalUrl" className="block text-sm font-medium mb-1">Canonical URL</label>
            <input {...register("canonicalUrl")} placeholder="https://ornek.com" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="robots" className="block text-sm font-medium mb-1">Robots Meta</label>
            <input {...register("robots")} placeholder="index, follow" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="favicon" className="block text-sm font-medium mb-1">Favicon URL</label>
            <input {...register("favicon")} placeholder="/favicon.ico" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>

      {/* robots.txt and sitemap.xml */}
      <div className="p-6 border rounded-lg bg-white dark:bg-dark-card">
        <h2 className="text-xl font-semibold mb-4">Arama Motoru Dosyaları</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="robotsTxt" className="block text-sm font-medium mb-1">robots.txt İçeriği</label>
            <textarea {...register("robotsTxt")} rows={8} className="w-full p-2 rounded bg-gray-800 text-gray-200 font-mono" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Sitemap</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              `sitemap.xml` dosyası, blog yazılarınız ve projeleriniz eklendikçe otomatik olarak güncellenir. Manuel bir işlem yapmanıza gerek yoktur.
              <Link href="/sitemap.xml" target="_blank" className="text-brand-primary hover:underline ml-2">
                Sitemap&apos;i Görüntüle
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Open Graph (Facebook, etc.) */}
      <div className="p-6 border rounded-lg bg-white dark:bg-dark-card">
        <h2 className="text-xl font-semibold mb-4">Open Graph Ayarları (Sosyal Medya)</h2>
        <div className="space-y-4">
          <input type="hidden" {...register("ogType")} value="website" />
          <input type="hidden" {...register("ogUrl")} value={watch("canonicalUrl")} />
          <input type="hidden" {...register("ogSiteName")} value={watch("siteTitle")} />
          <div>
            <label htmlFor="ogTitle" className="block text-sm font-medium mb-1">OG Başlık</label>
            <input {...register("ogTitle")} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="ogDescription" className="block text-sm font-medium mb-1">OG Açıklama</label>
            <textarea {...register("ogDescription")} rows={3} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="ogImage" className="block text-sm font-medium mb-1">OG Görsel URL</label>
            <input {...register("ogImage")} placeholder="https://ornek.com/og-gorsel.png" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>

      {/* Twitter Card */}
      <div className="p-6 border rounded-lg bg-white dark:bg-dark-card">
        <h2 className="text-xl font-semibold mb-4">Twitter Kart Ayarları</h2>
        <div className="space-y-4">
          <input type="hidden" {...register("twitterCard")} value="summary_large_image" />
          <div>
            <label htmlFor="twitterSite" className="block text-sm font-medium mb-1">Twitter Site (@kullanici)</label>
            <input {...register("twitterSite")} placeholder="@kullaniciadi" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="twitterCreator" className="block text-sm font-medium mb-1">Twitter Yaratıcı (@kullanici)</label>
            <input {...register("twitterCreator")} placeholder="@kullaniciadi" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
           <div>
            <label htmlFor="twitterTitle" className="block text-sm font-medium mb-1">Twitter Başlık</label>
            <input {...register("twitterTitle")} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="twitterDescription" className="block text-sm font-medium mb-1">Twitter Açıklama</label>
            <textarea {...register("twitterDescription")} rows={3} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="twitterImage" className="block text-sm font-medium mb-1">Twitter Görsel URL</label>
            <input {...register("twitterImage")} placeholder="https://ornek.com/twitter-gorsel.png" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>

      <div className="text-right">
        <button type="submit" disabled={isSubmitting} className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400">
          {isSubmitting ? "Güncelleniyor..." : "Güncelle"}
        </button>
      </div>
    </form>
  );
}
