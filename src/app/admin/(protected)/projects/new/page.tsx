/**
 * @file Yeni bir proje oluşturma sayfası.
 * @description Bu sayfa, kullanıcıya yeni bir proje eklemesi için
 *              boş bir `ProjectForm` bileşeni sunar.
 */

import ProjectForm from "@/components/admin/ProjectForm";

/**
 * Yeni proje ekleme sayfasının ana bileşeni.
 */
export default function NewProjectPage() {
  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Yeni Proje Oluştur</h1>
      {/* Herhangi bir başlangıç verisi olmadan boş bir form render edilir. */}
      <ProjectForm />
    </div>
  );
}
