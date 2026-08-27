import Link from 'next/link';
import { FaNewspaper, FaArrowLeft } from 'react-icons/fa';

export default function ContentNotFound() {
  return (
    <div className="container-responsive py-20">
      <div className="max-w-2xl mx-auto glass-card-premium p-8 text-center">
        <FaNewspaper className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">İçerik Bulunamadı</h2>
        <p className="text-muted-foreground mb-6">
          Aradığınız blog yazısı veya proje mevcut değil. Diğer bölümler (Mağaza, Dashboard) çalışmaya devam ediyor.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/blog" className="admin-btn admin-btn-primary">
            Blog'a Dön
          </Link>
          <Link href="/" className="admin-btn admin-btn-secondary">
            <FaArrowLeft /> Anasayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
