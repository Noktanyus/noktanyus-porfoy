"use client";

import { useState, useEffect } from "react";
import BlogForm from "@/components/admin/BlogForm";
import { Blog } from "@/types/content";
import toast from "react-hot-toast";

export default function EditBlogPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [post, setPost] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchPostData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/content?type=blog&slug=${slug}.md`);
        if (!response.ok) throw new Error("Yazı verileri yüklenemedi.");
        const { data, content } = await response.json();
        setPost({ ...data, id: slug, content: content });
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostData();
  }, [slug]);

  if (isLoading) {
    return <div className="text-center p-8">Yazı yükleniyor...</div>;
  }

  if (!post) {
    return <div className="text-center p-8 text-red-500">Yazı bulunamadı.</div>;
  }

  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Yazıyı Düzenle: {post.title}</h1>
      <BlogForm post={post} />
    </div>
  );
}
