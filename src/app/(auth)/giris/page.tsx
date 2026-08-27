import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Hesabınıza giriş yaparak dashboard'a erişin",
  robots: { index: false, follow: false },
};

export default function GirisPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-blob-decoration px-4 py-12 pt-24">
      <div className="w-full max-w-md">
        <div className="glass-card-premium p-8">
          <h1 className="text-2xl font-bold mb-2 text-center">Giriş Yap</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Hesabınıza erişin
          </p>
          <LoginForm />
          <p className="text-sm text-center mt-6 text-muted-foreground">
            Hesabınız yok mu?{" "}
            <Link
              href="/kayit"
              className="text-primary font-semibold hover:underline"
            >
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
