/**
 * @file Belirli bir blog yazısını düzenleme sayfası.
 * @description URL'den alınan 'slug' parametresine göre ilgili yazının verilerini
 *              API'den çeker ve `BlogForm` bileşenini bu veriyle doldurarak
 *              düzenleme arayüzünü oluşturur.
 */

"use client";

import { useState, useEffect } from "react";
import BlogForm from "@/components/admin/BlogForm";
import { Blog } from "@/types/content";
import toast from "react-hot-toast";

/**
 * Blog yazısı düzenleme sayfasının ana bileşeni.
 * @param {{ params: { slug: string } }} props - Sayfanın aldığı proplar. `params.slug` düzenlenecek yazının kimliğidir.
 */
export default function EditBlogPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [post, setPost] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Slug parametresi yoksa işlem yapma.
    if (!slug) return;

    /**
     * API'den düzenlenecek olan blog yazısının verilerini getiren asenkron fonksiyon.
     */
    const fetchPostData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/content?type=blog&slug=${slug}`);
        if (!response.ok) {
          throw new Error("Yazı verileri sunucudan yüklenemedi.");
        }
        const { data, content } = await response.json();
        // Gelen veriye URL'den gelen slug'ı ve içeriği ekleyerek state'i güncelle.
        // Bu, formun doğru ve eksiksiz veriyle dolmasını sağlar.
        setPost({ ...data, slug: slug, content: content });
      } catch (error) {
        toast.error((error as Error).message);
        setPost(null); // Hata durumunda mevcut post verisini temizle.
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostData();
  }, [slug]); // useEffect, sadece slug değiştiğinde yeniden çalışır.

  // Veri yüklenirken gösterilecek içerik.
  if (isLoading) {
    return <div className="text-center p-8">Yazı bilgileri yükleniyor...</div>;
  }

  // Yazı bulunamadıysa veya bir hata oluştuysa gösterilecek içerik.
  if (!post) {
    return <div className="text-center p-8 text-red-500">İstenen yazı bulunamadı veya yüklenirken bir hata oluştu.</div>;
  }

  // Veri başarıyla yüklendiğinde formu göster.
  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Yazıyı Düzenle: {post.title}</h1>
      {/* Mevcut yazı verileriyle doldurulmuş BlogForm bileşeni */}
      <BlogForm post={post} />
    </div>
  );
}
