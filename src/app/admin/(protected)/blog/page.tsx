/**
 * @file Blog yönetimi sayfası.
 * @description Bu sayfa, mevcut tüm blog yazılarını bir liste halinde gösterir.
 *              Kullanıcıların yeni yazı eklemesine, mevcut yazıları düzenlemesine
 *              ve silmesine olanak tanır.
 *
 * Faz D:
 *  - Yükleniyor durumu düz metin yerine `LoadingSkeleton variant="table-row"`.
 *  - Hata durumu artık yalnızca toast değil; kalıcı `ErrorDisplay` + "Tekrar Dene".
 *    (Önceden fetch hatasında sayfa boş bir tablo gösteriyordu ve kullanıcı
 *    verinin yüklenip yüklenmediğini anlayamıyordu.)
 *  - Boş durum `EmptyState`, tablo `ResponsiveTable`, başlık `PageHeader`.
 *  - Kullanılmayan `handleDelete` fonksiyonu kaldırıldı (silme işi
 *    `DeleteButton` üzerinden yapılıyordu; ölü kod iki farklı endpoint
 *    kullanıyordu ve kafa karıştırıcıydı).
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FaPlus, FaEdit } from "react-icons/fa";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

/** Blog yazısının temel bilgilerini içeren tip. */
type BlogPost = {
  slug: string;
  title: string;
};

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * API'den tüm blog yazılarını getiren fonksiyon.
   * useCallback ile sarmalanarak gereksiz yeniden oluşturulması önlenmiştir.
   */
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/content?type=blog');
      if (!response.ok) {
        throw new Error("Blog yazıları sunucudan yüklenemedi.");
      }
      const data = await response.json();
      // Gelen verinin bir dizi olduğundan emin ol, değilse boş dizi ata.
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Bileşen ilk yüklendiğinde yazıları getir.
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const header = (
    <PageHeader
      title="Blog Yönetimi"
      description="Blog yazılarınızı oluşturun, düzenleyin ve yönetin"
      breadcrumb={<span>Admin / Blog</span>}
      actions={
        <>
          <Link href="/admin/blog/scheduled" className="admin-btn admin-btn-secondary">
            Taslaklar
          </Link>
          <Link href="/admin/blog/new" className="admin-btn admin-btn-primary">
            <FaPlus aria-hidden="true" className="w-3 h-3" />
            Yeni Yazı Ekle
          </Link>
        </>
      }
    />
  );

  if (isLoading) {
    return (
      <div className="admin-content-spacing">
        {header}
        <LoadingSkeleton variant="table-row" count={5} loadingLabel="Blog yazıları yükleniyor" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-content-spacing">
        {header}
        <ErrorDisplay
          variant="card"
          title="Blog yazıları yüklenemedi"
          message={error}
          onRetry={fetchPosts}
          showHomeLink={false}
        />
      </div>
    );
  }

  return (
    <div className="admin-content-spacing">
      {header}

      <DashboardSection
        padding={posts.length === 0 ? 'md' : 'none'}
        contained
        meta={posts.length > 0 ? `${posts.length} yazı` : undefined}
      >
        {posts.length === 0 ? (
          <EmptyState
            variant="inline"
            icon="file"
            title="Henüz blog yazısı eklenmemiş"
            description="İlk yazınızı oluşturarak başlayın. Taslak olarak kaydedip daha sonra yayınlayabilirsiniz."
            action={{ label: 'Yeni Yazı Ekle', href: '/admin/blog/new' }}
          />
        ) : (
          <ResponsiveTable
            minWidth="560px"
            caption="Blog yazıları: başlık, slug ve işlemler"
            className="rounded-none border-0"
          >
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Yazı Başlığı</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Slug</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.slug}
                  className="border-t border-border/40 transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{post.title}</td>
                  <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                    {post.slug}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/blog/edit/${post.slug}`}
                        className="admin-btn admin-btn-ghost px-3"
                        aria-label={`${post.title} yazısını düzenle`}
                      >
                        <FaEdit aria-hidden="true" size={14} />
                        <span className="sr-only sm:not-sr-only">Düzenle</span>
                      </Link>
                      <DeleteButton
                        endpoint={`/api/admin/blog/${post.slug}`}
                        itemName={post.title}
                        confirmMessage={`'${post.title}' yazısını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
                        onSuccess={() => setPosts((prev) => prev.filter((p) => p.slug !== post.slug))}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        )}
      </DashboardSection>
    </div>
  );
}
