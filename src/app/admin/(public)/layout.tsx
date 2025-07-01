// src/app/admin/(public)/layout.tsx
import { Toaster } from "react-hot-toast";

export default function PublicAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Bu layout, sadece giriş sayfası gibi halka açık admin sayfaları içindir.
    // Kenar çubuğu veya diğer admin bileşenlerini içermez.
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-bg">
      <Toaster position="top-right" />
      {children}
    </div>
  );
}
