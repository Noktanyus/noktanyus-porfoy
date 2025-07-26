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
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

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
    <div className="admin-content-spacing">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">🚀 Proje Yönetimi</h1>
          <p className="admin-subtitle">Projelerinizi oluşturun, düzenleyin ve yönetin</p>
        </div>
        <Link href="/admin/projects/new" className="admin-button-primary">
          <FaPlus className="mr-2" />
          Yeni Proje Ekle
        </Link>
      </div>
      
      <div className="admin-section">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Proje Başlığı</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Slug</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <tr key={project.slug} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-300 ease-out">
                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">{project.title}</td>
                    <td className="py-4 px-6 font-mono text-sm text-gray-600 dark:text-gray-400">{project.slug}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end space-x-3">
                        <Link href={`/admin/projects/edit/${project.slug}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" aria-label={`${project.title} projesini düzenle`}>
                          <FaEdit size={16} />
                        </Link>
                        <button onClick={() => handleDelete(project.slug)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" aria-label={`${project.title} projesini sil`}>
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
                      <div className="text-4xl">🚀</div>
                      <div>
                        <p className="text-lg font-medium">Henüz proje eklenmemiş</p>
                        <p className="text-sm mt-1">"Yeni Proje Ekle" butonu ile başlayabilirsiniz</p>
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
}
