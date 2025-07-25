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
    <div className="admin-card animate-fade-in">
      {/* Mobile-first responsive header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Proje Yönetimi</h1>
        <Link href="/admin/projects/new">
          <button className="admin-button-primary w-full sm:w-auto">
            <span className="sm:hidden">+ Yeni Proje</span>
            <span className="hidden sm:inline">Yeni Proje Ekle</span>
          </button>
        </Link>
      </div>
      
      {/* Responsive table container */}
      <div className="admin-table-container">
        {/* Mobile card view for small screens */}
        <div className="block sm:hidden space-y-4">
          {projects.length > 0 ? (
            projects.map((project) => (
              <div key={project.slug} className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4 space-y-3">
                <div>
                  <h3 className="font-medium text-base">{project.title}</h3>
                  <p className="text-sm text-gray-500 font-mono mt-1">{project.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/projects/edit/${project.slug}`} className="flex-1">
                    <button className="admin-button-secondary w-full text-sm">
                      Düzenle
                    </button>
                  </Link>
                  <button 
                    onClick={() => handleDelete(project.slug)} 
                    className="admin-button bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 flex-1 text-sm"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-base">Henüz proje eklenmemiş.</p>
              <p className="text-sm mt-2">&quot;Yeni Proje&quot; butonu ile başlayabilirsiniz.</p>
            </div>
          )}
        </div>

        {/* Desktop table view */}
        <table className="admin-table hidden sm:table">
          <thead className="bg-gray-100 dark:bg-dark-bg">
            <tr>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-base font-semibold">Proje Başlığı</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-base font-semibold">Dosya Adı (Slug)</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-sm sm:text-base font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {projects.length > 0 ? (
              projects.map((project) => (
                <tr key={project.slug} className="hover:bg-gray-50 dark:hover:bg-dark-card transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-base font-medium">{project.title}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-base text-gray-500 font-mono">{project.slug}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-sm sm:text-base">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/projects/edit/${project.slug}`}>
                        <button className="text-brand-primary hover:underline font-medium px-2 py-1 rounded">
                          Düzenle
                        </button>
                      </Link>
                      <button 
                        onClick={() => handleDelete(project.slug)} 
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
