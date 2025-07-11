/**
 * @file Popup yönetimi sayfası.
 * @description Bu sayfa, mevcut tüm popup'ları bir liste halinde gösterir.
 *              Kullanıcıların yeni popup eklemesine, mevcutları düzenlemesine,
 *              silmesine ve aktif/pasif durumunu değiştirmesine olanak tanır.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Popup } from "@/types/content";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

export default function PopupsAdminPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * API'den tüm popup verilerini çeker ve duruma göre sıralar.
   */
  const fetchPopups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/content?type=popups');
      if (!response.ok) throw new Error("Popup'lar sunucudan yüklenemedi.");
      const data = await response.json();
      // Aktif olanları üste alacak şekilde sırala
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

  /**
   * Belirtilen popup'ı siler.
   * @param slug - Silinecek popup'ın kimliği.
   */
  const handleDelete = async (slug: string) => {
    if (!confirm(`&apos;${slug}&apos; kodlu popup&apos;ı kalıcı olarak silmek istediğinizden emin misiniz?`)) return;

    const loadingToast = toast.loading("Popup siliniyor...");
    try {
      // API'ye slug'ı temiz olarak gönder
      const response = await fetch(`/api/admin/content?type=popups&slug=${slug}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Silme işlemi başarısız oldu.");
      }
      toast.success("Popup başarıyla silindi!", { id: loadingToast });
      fetchPopups(); // Listeyi yenile
    } catch (error) {
      toast.error((error as Error).message, { id: loadingToast });
    }
  };
  
  /**
   * Bir popup'ın aktif/pasif durumunu değiştirir.
   * @param popup - Durumu değiştirilecek popup nesnesi.
   */
  const handleToggleActive = async (popup: Popup) => {
    const toastId = toast.loading('Popup durumu güncelleniyor...');
    try {
      // Popup'ın isActive durumunu tersine çevir
      const updatedPopup = { ...popup, isActive: !popup.isActive };
      
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'popups',
          slug: popup.slug, // Slug'ı dosya adı olarak kullan
          originalSlug: popup.slug, // Güncelleme olduğunu belirtmek için
          data: updatedPopup
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Durum güncellenemedi.');
      }
      
      toast.success('Durum başarıyla güncellendi!', { id: toastId });
      fetchPopups(); // Listeyi yenile
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Popup Yönetimi</h1>
          <div className="bg-brand-primary h-10 w-40 rounded-lg animate-pulse"></div>
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
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end space-x-4">
                        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
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
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={popup.isActive}
                          onChange={() => handleToggleActive(popup)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-primary"></div>
                      </label>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap font-mono text-sm">{popup.slug}</td>
                    <td className="py-4 px-6 whitespace-nowrap font-medium">{popup.title}</td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <Link href={`/admin/popups/edit/${popup.slug}`} className="text-brand-primary hover:text-brand-primary-dark mr-4 transition-colors inline-block align-middle" aria-label={`${popup.title} popup'ını düzenle`}>
                        <FaEdit size={18} />
                      </Link>
                      <button onClick={() => handleDelete(popup.slug)} className="text-red-500 hover:text-red-700 transition-colors inline-block align-middle" aria-label={`${popup.title} popup'ını sil`}>
                        <FaTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">
                    Henüz hiç popup oluşturulmamış. &quot;Yeni Popup Ekle&quot; butonu ile başlayabilirsiniz.
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
