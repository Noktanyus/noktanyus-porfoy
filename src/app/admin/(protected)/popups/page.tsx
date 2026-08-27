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
import { FaPlus, FaEdit } from "react-icons/fa";
import { DeleteButton } from "@/components/admin/DeleteButton";

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
    if (!confirm(`'${slug}' kodlu popup'ı kalıcı olarak silmek istediğinizden emin misiniz?`)) return;

    const loadingToast = toast.loading("Popup siliniyor...");
    try {
      // API'ye slug'ı temiz olarak gönder
      const response = await fetch(`/api/admin/content?type=popups&slug=${slug}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Silme işlemi başarısız oldu.");
      }
      toast.success("Popup başarıyla silindi!", { id: loadingToast });
      setPopups(prev => prev.filter(p => p.slug !== slug));
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
      <div className="admin-content-spacing">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">🎯 Popup Yönetimi</h1>
            <p className="admin-subtitle">Popup&apos;larınızı oluşturun, düzenleyin ve yönetin</p>
          </div>
          <div className="admin-btn admin-btn-primary animate-pulse">
            Yükleniyor...
          </div>
        </div>

        <div className="admin-section">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Durum</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Popup Kodu</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Başlık</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="h-6 w-11 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end space-x-3">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
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
    <div className="admin-content-spacing">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">🎯 Popup Yönetimi</h1>
          <p className="admin-subtitle">Popup&apos;larınızı oluşturun, düzenleyin ve yönetin</p>
        </div>
        <Link href="/admin/popups/new" className="admin-btn admin-btn-primary">
          <FaPlus className="mr-2" />
          Yeni Popup Ekle
        </Link>
      </div>

      <div className="admin-section">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Durum</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Popup Kodu</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Başlık</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {popups.length > 0 ? (
                popups.map((popup) => (
                  <tr key={popup.slug} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-300 ease-out ${!popup.isActive ? 'opacity-60' : ''}`}>
                    <td className="py-4 px-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={popup.isActive}
                          onChange={() => handleToggleActive(popup)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
                      </label>
                    </td>
                    <td className="py-4 px-6 font-mono text-sm text-gray-600 dark:text-gray-400">{popup.slug}</td>
                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">{popup.title}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end space-x-3">
                        <Link href={`/admin/popups/edit/${popup.slug}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" aria-label={`${popup.title} popup&apos;ını düzenle`}>
                          <FaEdit size={16} />
                        </Link>
                        <DeleteButton
                          endpoint={`/api/admin/popups/${popup.slug}`}
                          itemName={popup.title}
                          confirmMessage={`'${popup.title}' popup&apos;ını kalıcı olarak silmek istediğinizden emin misiniz?`}
                          onSuccess={() => setPopups((prev) => prev.filter((p) => p.slug !== popup.slug))}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="text-4xl">🎯</div>
                      <div>
                        <p className="text-lg font-medium">Henüz popup oluşturulmamış</p>
                        <p className="text-sm mt-1">&quot;Yeni Popup Ekle&quot; butonu ile başlayabilirsiniz</p>
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
