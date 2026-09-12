import { Metadata } from "next";
import Link from "next/link";
import { RegisterWizard } from "@/components/auth/RegisterWizard";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Ücretsiz hesap oluşturun",
  robots: { index: false, follow: false },
};

export default function KayitPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-blob-decoration px-4 py-8">
      <div className="w-full max-w-md">
        <div className="glass-card-premium p-8">
          <h1 className="text-2xl font-bold mb-2 text-center text-slate-900 dark:text-white">
            Hesap Oluştur
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
            Ücretsiz başlayın, 14 gün Pro deneyin
          </p>
          <RegisterWizard />
          <p className="text-sm text-center mt-6 text-slate-600 dark:text-slate-400">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/giris"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
