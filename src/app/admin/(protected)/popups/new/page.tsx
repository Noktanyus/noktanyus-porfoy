import PopupForm from "@/components/admin/PopupForm";

export default function NewPopupPage() {
  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Yeni Popup Oluştur</h1>
      <PopupForm />
    </div>
  );
}
