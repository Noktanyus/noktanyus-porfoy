/**
 * @file Belirli bir blog yazısını düzenleme sayfası.
 * @description URL'den alınan 'slug' parametresine göre ilgili yazının verilerini
 *              API'den çeker ve `BlogForm` bileşenini bu veriyle doldurarak
 *              düzenleme arayüzünü oluşturur.
 *
 * Faz D:
 *  - Düz metin "yükleniyor" / kırmızı hata satırı yerine ortak
 *    `LoadingSkeleton` ve `ErrorDisplay` (Tekrar Dene ile) kullanıldı.
 *  - Başlık `PageHeader` (breadcrumb + geri linki) ile standartlaştırıldı.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import BlogForm from "@/components/admin/BlogForm";
import { Blog } from "@/types/content";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

/**
 * Blog yazısı düzenleme sayfasının ana bileşeni.
 * @param {{ params: { slug: string } }} props - Sayfanın aldığı proplar. `params.slug` düzenlenecek yazının kimliğidir.
 */
export default function EditBlogPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [post, setPost] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * API'den düzenlenecek olan blog yazısının verilerini getirir.
   */
  const fetchPostData = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/content?type=blog&slug=${encodeURIComponent(slug)}`);
      if (!response.ok) {
        throw new Error("Yazı verileri sunucudan yüklenemedi.");
      }
      const postData = await response.json();
      setPost(postData ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
      setError(message);
      setPost(null); // Hata durumunda mevcut post verisini temizle.
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPostData();
  }, [fetchPostData]);

  const header = (
    <PageHeader
      title={post ? `Yazıyı Düzenle: ${post.title}` : 'Yazıyı Düzenle'}
      description={<span className="font-mono text-xs break-all">{slug}</span>}
      backHref="/admin/blog"
      backLabel="Blog Yönetimi"
      breadcrumb={<span>Admin / Blog / Düzenle</span>}
    />
  );

  if (isLoading) {
    return (
      <div className="admin-content-spacing">
        {header}
        <LoadingSkeleton variant="text-line" count={6} loadingLabel="Yazı bilgileri yükleniyor" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="admin-content-spacing">
        {header}
        <ErrorDisplay
          variant="card"
          title="Yazı yüklenemedi"
          message={
            error ??
            'İstenen yazı bulunamadı. Silinmiş olabilir veya slug hatalı olabilir.'
          }
          onRetry={fetchPostData}
          showHomeLink={false}
        />
      </div>
    );
  }

  // Veri başarıyla yüklendiğinde formu göster.
  return (
    <div className="admin-content-spacing">
      {header}
      <DashboardSection padding="lg">
        {/* Mevcut yazı verileriyle doldurulmuş BlogForm bileşeni */}
        <BlogForm post={post} />
      </DashboardSection>
    </div>
  );
}
