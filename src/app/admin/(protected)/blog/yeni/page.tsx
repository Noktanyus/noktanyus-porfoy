// src/app/admin/(protected)/blog/yeni/page.tsx
import BlogForm from "@/components/admin/BlogForm";

export default function NewBlogPostPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Yeni Blog Yazısı Ekle</h1>
      <BlogForm />
    </div>
  );
}
