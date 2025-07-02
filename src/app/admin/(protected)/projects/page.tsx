"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

type ProjectPost = {
  slug: string;
  title: string;
};

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<ProjectPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/content?action=list&type=projects');
      if (!response.ok) throw new Error("Projeler yüklenemedi.");
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

  const handleDelete = async (slug: string) => {
    if (confirm('Bu projeyi silmek istediğinizden emin misiniz?')) {
      const toastId = toast.loading('Proje siliniyor...');
      try {
        const response = await fetch(`/api/admin/content?type=projects&slug=${slug}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Silme işlemi başarısız oldu.');
        }
        toast.success('Proje başarıyla silindi.', { id: toastId });
        setProjects(projects.filter(p => p.slug !== slug)); // Listeyi anında güncelle
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
        <table className="min-w-full">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="text-left py-3 px-4 font-semibold">Başlık</th>
              <th className="text-left py-3 px-4 font-semibold">Dosya Adı (Slug)</th>
              <th className="text-right py-3 px-4 font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {projects.length > 0 ? (
              projects.map((project) => (
                <tr key={project.slug} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 font-medium">{project.title}</td>
                  <td className="py-3 px-4 text-gray-500">{project.slug}</td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/projects/edit/${project.slug}`}>
                      <span className="text-blue-500 hover:underline mr-4 cursor-pointer font-medium">Düzenle</span>
                    </Link>
                    <button onClick={() => handleDelete(project.slug)} className="text-red-500 hover:underline font-medium">
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-6 text-gray-500">
                  Henüz proje eklenmemiş. "Yeni Proje Ekle" butonu ile başlayabilirsiniz.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
