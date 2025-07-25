/**
 * @file Blog yönetimi sayfası.
 * @description Bu sayfa, mevcut tüm blog yazılarını bir liste halinde gösterir.
 *              Kullanıcıların yeni yazı eklemesine, mevcut yazıları düzenlemesine
 *              ve silmesine olanak tanır.
 */

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

/** Blog yazısının temel bilgilerini içeren tip. */
type BlogPost = {
  slug: string;
  title: string;
};

/**
 * Blog yazılarını listeleyen ve yöneten ana bileşen.
 */
const BlogList = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * API'den tüm blog yazılarını getiren fonksiyon.
   * useCallback ile sarmalanarak gereksiz yeniden oluşturulması önlenmiştir.
   */
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/content?type=blog');
      if (!response.ok) {
        throw new Error("Blog yazıları sunucudan yüklenemedi.");
      }
      const data = await response.json();
      // Gelen verinin bir dizi olduğundan emin ol, değilse boş dizi ata.
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
      console.error("Blog yazıları getirilirken hata oluştu:", error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Bileşen ilk yüklendiğinde yazıları getir.
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  /**
   * Belirtilen 'slug'a sahip yazıyı silme işlemini gerçekleştirir.
   * @param {string} slug - Silinecek yazının kimliği.
   */
  const handleDelete = async (slug: string) => {
    // Kullanıcıdan silme onayı al.
    if (confirm(`'${slug}' başlıklı yazıyı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      const toastId = toast.loading('Yazı siliniyor, lütfen bekleyin...');
      try {
        const response = await fetch(`/api/admin/content?type=blog&slug=${slug}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Yazı silinirken bir hata oluştu.');
        }
        toast.success('Yazı başarıyla silindi.', { id: toastId });
        // Silme işlemi başarılı olursa, state'i güncelleyerek listeyi yenile.
        setPosts(posts.filter(p => p.slug !== slug));
      } catch (error) {
        toast.error((error as Error).message, { id: toastId });
      }
    }
  };

  // Veri yüklenirken gösterilecek içerik.
  if (isLoading) {
    return <div className="text-center p-8">Blog yazıları yükleniyor...</div>;
  }

  return (
    <div className="admin-card animate-fade-in">
      {/* Mobile-first responsive header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Blog Yönetimi</h1>
        <Link href="/admin/blog/yeni">
          <button className="admin-button-primary w-full sm:w-auto">
            <span className="sm:hidden">+ Yeni Yazı</span>
            <span className="hidden sm:inline">Yeni Yazı Ekle</span>
          </button>
        </Link>
      </div>
      
      {/* Responsive table container */}
      <div className="admin-table-container">
        {/* Mobile card view for small screens */}
        <div className="block sm:hidden space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.slug} className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4 space-y-3">
                <div>
                  <h3 className="font-medium text-base">{post.title}</h3>
                  <p className="text-sm text-gray-500 font-mono mt-1">{post.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/blog/edit/${post.slug}`} className="flex-1">
                    <button className="admin-button-secondary w-full text-sm">
                      Düzenle
                    </button>
                  </Link>
                  <button 
                    onClick={() => handleDelete(post.slug)} 
                    className="admin-button bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 flex-1 text-sm"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-base">Henüz blog yazısı eklenmemiş.</p>
              <p className="text-sm mt-2">&quot;Yeni Yazı Ekle&quot; butonu ile başlayabilirsiniz.</p>
            </div>
          )}
        </div>

        {/* Desktop table view */}
        <table className="admin-table hidden sm:table">
          <thead className="bg-gray-100 dark:bg-dark-bg">
            <tr>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-base font-semibold">Yazı Başlığı</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-base font-semibold">Dosya Adı (Slug)</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-sm sm:text-base font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {posts.length > 0 ? (
              posts.map((post) => (
                <tr key={post.slug} className="hover:bg-gray-50 dark:hover:bg-dark-card transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-base font-medium">{post.title}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-base text-gray-500 font-mono">{post.slug}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-sm sm:text-base">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/blog/edit/${post.slug}`}>
                        <button className="text-brand-primary hover:underline font-medium px-2 py-1 rounded">
                          Düzenle
                        </button>
                      </Link>
                      <button 
                        onClick={() => handleDelete(post.slug)} 
                        className="text-red-500 hover:underline font-medium px-2 py-1 rounded"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-16 text-gray-500">
                  Henüz blog yazısı eklenmemiş. &quot;Yeni Yazı Ekle&quot; butonu ile başlayabilirsiniz.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Blog yönetimi sayfasını Suspense içinde render eden ana sayfa bileşeni.
 * Bu, veri yüklemesi sırasında bir yedek (fallback) arayüz gösterilmesini sağlar.
 */
export default function BlogAdminPage() {
  return (
    <Suspense fallback={<div className="text-center p-8">Sayfa yükleniyor...</div>}>
      <BlogList />
    </Suspense>
  );
}
