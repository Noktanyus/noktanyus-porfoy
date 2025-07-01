"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Popup } from "@/types/content";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

export default function PopupsAdminPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPopups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/content?type=popups');
      if (!response.ok) throw new Error("Popup'lar yüklenemedi.");
      const data = await response.json();
      setPopups(data.sort((a: Popup, b: Popup) => (a.isActive === b.isActive) ? 0 : a.isActive ? -1 : 1));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPopups();
  }, [fetchPopups]);

  const handleDelete = async (slug: string) => {
    if (!confirm(`'${slug}' kodlu popup'ı silmek istediğinizden emin misiniz?`)) return;

    const loadingToast = toast.loading("Popup siliniyor...");
    try {
      const response = await fetch(`/api/admin/content?type=popups&slug=${slug}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Silme işlemi başarısız oldu.");
      }
      toast.success("Popup başarıyla silindi!", { id: loadingToast });
      fetchPopups();
    } catch (error) {
      toast.error((error as Error).message, { id: loadingToast });
    }
  };
  
  const handleToggleActive = async (popup: Popup) => {
    const toastId = toast.loading('Durum güncelleniyor...');
    try {
      const updatedPopup = { ...popup, isActive: !popup.isActive };
      const response = await fetch('/api/admin/content?type=popups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPopup),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Durum güncellenemedi.');
      }
      
      toast.success('Durum başarıyla güncellendi!', { id: toastId });
      fetchPopups();
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Popup Yönetimi</h1>
        <Link href="/admin/popups/new" className="bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
          <FaPlus className="mr-2" />
          Yeni Popup Ekle
        </Link>
      </div>
      
      <div className="bg-white dark:bg-dark-card shadow-lg rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100 dark:bg-dark-header">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-600 dark:text-gray-300">Durum</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-600 dark:text-gray-300">Popup Kodu (Slug)</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-600 dark:text-gray-300">Başlık</th>
                <th className="text-right py-3 px-6 font-semibold text-gray-600 dark:text-gray-300">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {popups.length > 0 ? (
                popups.map((popup) => (
                  <tr key={popup.slug} className={`hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors ${!popup.isActive ? 'opacity-50' : ''}`}>
                    <td className="py-4 px-6">
                      <input
                        type="checkbox"
                        checked={popup.isActive}
                        onChange={() => handleToggleActive(popup)}
                        aria-label="Aktif/Pasif"
                        className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                      />
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap font-mono text-sm">{popup.slug}</td>
                    <td className="py-4 px-6 whitespace-nowrap font-medium">{popup.title}</td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <Link href={`/admin/popups/edit/${popup.slug}`} className="text-brand-primary hover:text-brand-primary-dark mr-4 transition-colors inline-block align-middle">
                        <FaEdit size={18} />
                      </Link>
                      <button onClick={() => handleDelete(popup.slug)} className="text-red-500 hover:text-red-700 transition-colors inline-block align-middle">
                        <FaTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">
                    Henüz hiç popup oluşturulmamış.
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
