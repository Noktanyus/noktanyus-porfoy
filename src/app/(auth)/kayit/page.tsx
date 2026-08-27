import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Ücretsiz hesap oluşturun",
  robots: { index: false, follow: false },
};

export default function KayitPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-blob-decoration px-4 py-12 pt-24">
      <div className="w-full max-w-md">
        <div className="glass-card-premium p-8">
          <h1 className="text-2xl font-bold mb-2 text-center">Hesap Oluştur</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Ücretsiz başlayın
          </p>
          <RegisterForm />
          <p className="text-sm text-center mt-6 text-muted-foreground">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/giris"
              className="text-primary font-semibold hover:underline"
            >
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
