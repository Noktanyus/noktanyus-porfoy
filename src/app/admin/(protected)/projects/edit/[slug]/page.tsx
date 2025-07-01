"use client";

import { useState, useEffect } from "react";
import ProjectForm from "@/components/admin/ProjectForm";
import { Project } from "@/types/content";
import toast from "react-hot-toast";

export default function EditProjectPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchProjectData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/content?type=projects&slug=${slug}.md`);
        if (!response.ok) throw new Error("Proje verileri yüklenemedi.");
        const { data, content } = await response.json();
        setProject({ ...data, id: slug, contentHtml: content }); // 'id' ve 'content' ekle
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [slug]);

  if (isLoading) {
    return <div className="text-center p-8">Proje yükleniyor...</div>;
  }

  if (!project) {
    return <div className="text-center p-8 text-red-500">Proje bulunamadı.</div>;
  }

  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Projeyi Düzenle: {project.title}</h1>
      <ProjectForm project={project} />
    </div>
  );
}
