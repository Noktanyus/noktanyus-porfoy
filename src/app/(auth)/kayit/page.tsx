import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RegisterWizard } from "@/components/auth/RegisterWizard";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Ücretsiz hesap oluşturun — Google veya e-posta ile",
  robots: { index: false, follow: false },
};

export default function KayitPage() {
  return (
    <div className="relative min-h-[75vh] flex items-center justify-center bg-blob-decoration px-4 py-10 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,oklch(var(--primary)/0.18),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="w-full max-w-md">
        <div className="glass-card-premium p-8 sm:p-9 shadow-xl shadow-brand-primary/10">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary mb-2">
            Noktanyus
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-center text-foreground">
            Hesap Oluştur
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 text-center mb-6">
            Google ile hızlı kayıt veya e-posta ile ücretsiz hesap açın
          </p>
          <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
            <RegisterWizard />
          </Suspense>
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
