/**
 * @file Yeni bir blog yazısı oluşturma sayfası.
 * @description Bu sayfa, kullanıcıya yeni bir blog gönderisi eklemesi için
 *              boş bir `BlogForm` bileşeni sunar.
 * @see /src/app/admin/(protected)/blog/new/page.tsx Bu dosya ile aynı işlevi görmektedir.
 *      Proje tutarlılığı için bu dosyanın birleştirilmesi veya kaldırılması düşünülebilir.
 */
import BlogForm from "@/components/admin/BlogForm";

/**
 * Yeni blog yazısı ekleme sayfasının ana bileşeni.
 */
export default function NewBlogPostPage() {
  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Yeni Blog Yazısı Ekle</h1>
      {/* Herhangi bir başlangıç verisi olmadan boş bir form render edilir. */}
      <BlogForm />
    </div>
  );
}
