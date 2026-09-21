/**
 * @file Yeni bir popup oluşturma sayfası.
 * @description Bu sayfa, kullanıcıya yeni bir popup oluşturması için
 *              boş bir `PopupForm` bileşeni sunar.
 */

import PopupForm from "@/components/admin/PopupForm";

/**
 * Yeni popup oluşturma sayfasının ana bileşeni.
 */
export default function NewPopupPage() {
  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Yeni Popup Oluştur</h1>
      {/* Herhangi bir başlangıç verisi olmadan boş bir form render edilir. */}
      <PopupForm />
    </div>
  );
}
