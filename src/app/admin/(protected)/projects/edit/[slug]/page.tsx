/**
 * @file Belirli bir projeyi düzenleme sayfası.
 * @description URL'den alınan 'slug' parametresine göre ilgili projenin verilerini
 *              API'den çeker ve `ProjectForm` bileşenini bu veriyle doldurarak
 *              düzenleme arayüzünü oluşturur.
 */

"use client";

import { useState, useEffect } from "react";
import ProjectForm from "@/components/admin/ProjectForm";
import { Project } from "@/types/content";
import toast from "react-hot-toast";

/**
 * Proje düzenleme sayfasının ana bileşeni.
 * @param {{ params: { slug: string } }} props - Sayfanın aldığı proplar. `params.slug` düzenlenecek projenin kimliğidir.
 */
export default function EditProjectPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Slug parametresi yoksa işlem yapma.
    if (!slug) return;

    /**
     * API'den düzenlenecek olan projenin verilerini getiren asenkron fonksiyon.
     */
    const fetchProjectData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/content?type=projects&slug=${slug}`);
        if (!response.ok) {
          throw new Error("Proje verileri sunucudan yüklenemedi.");
        }
        const projectData = await response.json();
        setProject(projectData);
      } catch (error) {
        toast.error((error as Error).message);
        setProject(null); // Hata durumunda mevcut proje verisini temizle.
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [slug]); // useEffect, sadece slug değiştiğinde yeniden çalışır.

  // Veri yüklenirken gösterilecek içerik.
  if (isLoading) {
    return <div className="text-center p-8">Proje bilgileri yükleniyor...</div>;
  }

  // Proje bulunamadıysa veya bir hata oluştuysa gösterilecek içerik.
  if (!project) {
    return <div className="text-center p-8 text-red-500">İstenen proje bulunamadı veya yüklenirken bir hata oluştu.</div>;
  }

  // Veri başarıyla yüklendiğinde formu göster.
  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Projeyi Düzenle: {project.title}</h1>
      {/* Mevcut proje verileriyle doldurulmuş ProjectForm bileşeni */}
      <ProjectForm project={project} />
    </div>
  );
}
