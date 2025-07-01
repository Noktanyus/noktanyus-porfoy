import BlogForm from "@/components/admin/BlogForm";

export default function NewBlogPage() {
  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Yeni Blog Yazısı Ekle</h1>
      <BlogForm />
    </div>
  );
}
