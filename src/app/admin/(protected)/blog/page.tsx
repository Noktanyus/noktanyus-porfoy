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
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

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
    <div className="admin-content-spacing">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">📝 Blog Yönetimi</h1>
          <p className="admin-subtitle">Blog yazılarınızı oluşturun, düzenleyin ve yönetin</p>
        </div>
        <Link href="/admin/blog/yeni" className="admin-button-primary">
          <FaPlus className="mr-2" />
          Yeni Yazı Ekle
        </Link>
      </div>

      <div className="admin-section">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Yazı Başlığı</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Slug</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <tr key={post.slug} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-300 ease-out">
                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">{post.title}</td>
                    <td className="py-4 px-6 font-mono text-sm text-gray-600 dark:text-gray-400">{post.slug}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end space-x-3">
                        <Link href={`/admin/blog/edit/${post.slug}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" aria-label={`${post.title} yazısını düzenle`}>
                          <FaEdit size={16} />
                        </Link>
                        <button onClick={() => handleDelete(post.slug)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" aria-label={`${post.title} yazısını sil`}>
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="text-4xl">📝</div>
                      <div>
                        <p className="text-lg font-medium">Henüz blog yazısı eklenmemiş</p>
                        <p className="text-sm mt-1">"Yeni Yazı Ekle" butonu ile başlayabilirsiniz</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
