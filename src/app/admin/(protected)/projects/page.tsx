/**
 * @file Proje yönetimi sayfası.
 * @description Bu sayfa, mevcut tüm projeleri bir liste halinde gösterir.
 *              Kullanıcıların yeni proje eklemesine, mevcut projeleri düzenlemesine
 *              ve silmesine olanak tanır.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

/** Projenin temel bilgilerini içeren tip. */
type ProjectPost = {
  slug: string;
  title: string;
};

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<ProjectPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * API'den tüm projeleri getiren fonksiyon.
   */
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/content?type=projects');
      if (!response.ok) throw new Error("Projeler sunucudan yüklenemedi.");
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /**
   * Belirtilen 'slug'a sahip projeyi silme işlemini gerçekleştirir.
   * @param {string} slug - Silinecek projenin kimliği.
   */
  const handleDelete = async (slug: string) => {
    if (confirm(`Bu projeyi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      const toastId = toast.loading('Proje siliniyor, lütfen bekleyin...');
      try {
        const response = await fetch(`/api/admin/content?type=projects&slug=${slug}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Silme işlemi sırasında bir hata oluştu.');
        }
        toast.success('Proje başarıyla silindi.', { id: toastId });
        // Silme işlemi başarılı olursa, state'i güncelleyerek listeyi yenile.
        setProjects(projects.filter(p => p.slug !== slug));
      } catch (error) {
        toast.error((error as Error).message, { id: toastId });
      }
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Projeler yükleniyor...</div>;
  }

  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Proje Yönetimi</h1>
        <Link href="/admin/projects/new">
          <button className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
            Yeni Proje Ekle
          </button>
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100 dark:bg-dark-bg">
            <tr>
              <th className="text-left py-3 px-4 font-semibold">Proje Başlığı</th>
              <th className="text-left py-3 px-4 font-semibold">Dosya Adı (Slug)</th>
              <th className="text-right py-3 px-4 font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {projects.length > 0 ? (
              projects.map((project) => (
                <tr key={project.slug} className="hover:bg-gray-50 dark:hover:bg-dark-card transition-colors">
                  <td className="py-3 px-4 font-medium">{project.title}</td>
                  <td className="py-3 px-4 text-gray-500 font-mono">{project.slug}</td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/projects/edit/${project.slug}`} className="text-brand-primary hover:underline mr-4 font-medium">
                      Düzenle
                    </Link>
                    <button onClick={() => handleDelete(project.slug)} className="text-red-500 hover:underline font-medium">
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-16 text-gray-500">
                  Henüz proje eklenmemiş. &quot;Yeni Proje Ekle&quot; butonu ile başlayabilirsiniz.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
