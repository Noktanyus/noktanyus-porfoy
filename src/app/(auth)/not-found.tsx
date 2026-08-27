import Link from 'next/link';
import { FaUserShield } from 'react-icons/fa';

export default function AuthNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-blob-decoration px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-card-premium p-8 text-center">
          <FaUserShield className="w-12 h-12 mx-auto text-primary mb-3" />
          <h1 className="text-xl font-bold mb-2">Sayfa Bulunamadı</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Kimlik doğrulama sayfası mevcut değil.
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/giris" className="admin-btn admin-btn-primary text-sm">
              Giriş Sayfası
            </Link>
            <Link href="/" className="admin-btn admin-btn-secondary text-sm">
              Anasayfa
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
