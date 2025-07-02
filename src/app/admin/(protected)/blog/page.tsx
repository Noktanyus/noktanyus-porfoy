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
      const response = await fetch('/api/admin/content?action=list&type=blog');
      if (!response.ok) {
        throw new Error("Blog yazıları sunucudan yüklenemedi.");
      }
      const data = await response.json();
      // Gelen verinin bir dizi olduğundan emin ol, değilse boş dizi ata.
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error((error as Error).message);
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
        const response = await fetch(`/api/admin/content?type=blog&slug=${slug}.md`, {
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
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Blog Yönetimi</h1>
        <Link href="/admin/blog/yeni">
          <button className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
            Yeni Yazı Ekle
          </button>
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="text-left py-3 px-4 font-semibold">Yazı Başlığı</th>
              <th className="text-left py-3 px-4 font-semibold">Dosya Adı (Slug)</th>
              <th className="text-right py-3 px-4 font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {posts.length > 0 ? (
              posts.map((post) => (
                <tr key={post.slug} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="py-3 px-4 font-medium">{post.title}</td>
                  <td className="py-3 px-4 text-gray-500 font-mono">{post.slug}</td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/blog/edit/${post.slug}`} className="text-blue-500 hover:underline mr-4">
                      Düzenle
                    </Link>
                    <button onClick={() => handleDelete(post.slug)} className="text-red-500 hover:underline">
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-6 text-gray-500">
                  Henüz hiç blog yazısı oluşturulmamış.
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
