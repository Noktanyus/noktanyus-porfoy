"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

type BlogPost = {
  slug: string;
  title: string;
};

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/content?action=list&type=blog');
      if (!response.ok) throw new Error("Blog yazıları yüklenemedi.");
      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (slug: string) => {
    if (confirm('Bu yazıyı silmek istediğinizden emin misiniz?')) {
      const toastId = toast.loading('Yazı siliniyor...');
      try {
        const response = await fetch(`/api/admin/content?type=blog&slug=${slug}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Silme işlemi başarısız oldu.');
        }
        toast.success('Yazı başarıyla silindi.', { id: toastId });
        setPosts(posts.filter(p => p.slug !== slug)); // Listeyi anında güncelle
      } catch (error) {
        toast.error((error as Error).message, { id: toastId });
      }
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Blog Yönetimi</h1>
        <Link href="/admin/blog/yeni">
          <button className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600">
            Yeni Yazı Ekle
          </button>
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="text-left py-3 px-4">Başlık</th>
              <th className="text-right py-3 px-4">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {posts.length > 0 ? (
              posts.map((post) => (
                <tr key={post.slug} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4">{post.slug}</td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/blog/edit/${post.slug}`}>
                      <span className="text-blue-500 hover:underline mr-4">Düzenle</span>
                    </Link>
                    <button onClick={() => handleDelete(post.slug)} className="text-red-500 hover:underline">
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="text-center py-6">Henüz blog yazısı eklenmemiş.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}