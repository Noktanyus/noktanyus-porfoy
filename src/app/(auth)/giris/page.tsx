import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Google veya e-posta ile hesabınıza giriş yapın",
  robots: { index: false, follow: false },
};

export default function GirisPage() {
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
            Giriş Yap
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 text-center mb-6">
            Google ile hızlı giriş veya e-posta ile devam edin
          </p>
          <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
            <LoginForm />
          </Suspense>
          <p className="text-sm text-center mt-6 text-muted-foreground">
            Hesabınız yok mu?{" "}
            <Link
              href="/kayit"
              className="text-primary font-semibold hover:underline"
            >
              Ücretsiz kayıt ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
