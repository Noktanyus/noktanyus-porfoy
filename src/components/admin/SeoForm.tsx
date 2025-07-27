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
      siteKeywords: settings?.siteKeywords || '',
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
      siteKeywords: data.siteKeywords, // Keep as string since database expects string
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
    <form onSubmit={handleSubmit(onSubmit)} className="admin-content-spacing">
      {/* General SEO Settings */}
      <div className="admin-card">
        <h2 className="text-xl font-semibold mb-6">Genel SEO Ayarları</h2>
        <div className="space-y-6">
          <div>
            <label htmlFor="siteTitle" className="block text-sm font-medium mb-2">Site Başlığı</label>
            <input {...register("siteTitle", { required: "Zorunlu alan" })} className="admin-input" />
          </div>
          <div>
            <label htmlFor="siteDescription" className="block text-sm font-medium mb-2">Site Açıklaması</label>
            <textarea {...register("siteDescription")} rows={3} className="admin-input resize-y min-h-[80px]" />
          </div>
          <div>
            <label htmlFor="siteKeywords" className="block text-sm font-medium mb-2">Anahtar Kelimeler (virgülle ayırın)</label>
            <input {...register("siteKeywords")} className="admin-input" placeholder="web development, portfolio, blog" />
          </div>
          <div className="admin-form-grid">
            <div>
              <label htmlFor="canonicalUrl" className="block text-sm font-medium mb-2">Canonical URL</label>
              <input {...register("canonicalUrl")} placeholder="https://ornek.com" className="admin-input" />
            </div>
            <div>
              <label htmlFor="robots" className="block text-sm font-medium mb-2">Robots Meta</label>
              <input {...register("robots")} placeholder="index, follow" className="admin-input" />
            </div>
          </div>
          <div>
            <label htmlFor="favicon" className="block text-sm font-medium mb-2">Favicon URL</label>
            <input {...register("favicon")} placeholder="/favicon.ico" className="admin-input" />
          </div>
        </div>
      </div>

      {/* robots.txt and sitemap.xml */}
      <div className="admin-card">
        <h2 className="text-xl font-semibold mb-6">Arama Motoru Dosyaları</h2>
        <div className="space-y-6">
          <div>
            <label htmlFor="robotsTxt" className="block text-sm font-medium mb-2">robots.txt İçeriği</label>
            <textarea {...register("robotsTxt")} rows={8} className="admin-input bg-gray-800 text-gray-200 font-mono resize-y min-h-[160px]" />
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Sitemap</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              `sitemap.xml` dosyası, blog yazılarınız ve projeleriniz eklendikçe otomatik olarak güncellenir. Manuel bir işlem yapmanıza gerek yoktur.
            </p>
            <Link href="/sitemap.xml" target="_blank" className="inline-block mt-2 text-brand-primary hover:underline font-medium">
              Sitemap&apos;i Görüntüle →
            </Link>
          </div>
        </div>
      </div>

      {/* Open Graph (Facebook, etc.) */}
      <div className="admin-card">
        <h2 className="text-xl font-semibold mb-6">Open Graph Ayarları (Sosyal Medya)</h2>
        <div className="space-y-6">
          <input type="hidden" {...register("ogType")} value="website" />
          <input type="hidden" {...register("ogUrl")} value={watch("canonicalUrl")} />
          <input type="hidden" {...register("ogSiteName")} value={watch("siteTitle")} />
          <div>
            <label htmlFor="ogTitle" className="block text-sm font-medium mb-2">OG Başlık</label>
            <input {...register("ogTitle")} className="admin-input" />
          </div>
          <div>
            <label htmlFor="ogDescription" className="block text-sm font-medium mb-2">OG Açıklama</label>
            <textarea {...register("ogDescription")} rows={3} className="admin-input resize-y min-h-[80px]" />
          </div>
          <div>
            <label htmlFor="ogImage" className="block text-sm font-medium mb-2">OG Görsel URL</label>
            <input {...register("ogImage")} placeholder="https://ornek.com/og-gorsel.png" className="admin-input" />
          </div>
        </div>
      </div>

      {/* Twitter Card */}
      <div className="admin-card">
        <h2 className="text-xl font-semibold mb-6">Twitter Kart Ayarları</h2>
        <div className="space-y-6">
          <input type="hidden" {...register("twitterCard")} value="summary_large_image" />
          <div className="admin-form-grid">
            <div>
              <label htmlFor="twitterSite" className="block text-sm font-medium mb-2">Twitter Site (@kullanici)</label>
              <input {...register("twitterSite")} placeholder="@kullaniciadi" className="admin-input" />
            </div>
            <div>
              <label htmlFor="twitterCreator" className="block text-sm font-medium mb-2">Twitter Yaratıcı (@kullanici)</label>
              <input {...register("twitterCreator")} placeholder="@kullaniciadi" className="admin-input" />
            </div>
          </div>
          <div>
            <label htmlFor="twitterTitle" className="block text-sm font-medium mb-2">Twitter Başlık</label>
            <input {...register("twitterTitle")} className="admin-input" />
          </div>
          <div>
            <label htmlFor="twitterDescription" className="block text-sm font-medium mb-2">Twitter Açıklama</label>
            <textarea {...register("twitterDescription")} rows={3} className="admin-input resize-y min-h-[80px]" />
          </div>
          <div>
            <label htmlFor="twitterImage" className="block text-sm font-medium mb-2">Twitter Görsel URL</label>
            <input {...register("twitterImage")} placeholder="https://ornek.com/twitter-gorsel.png" className="admin-input" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting} className="admin-btn admin-btn-primary">
          {isSubmitting ? "Güncelleniyor..." : "Güncelle"}
        </button>
      </div>
    </form>
  );
}
