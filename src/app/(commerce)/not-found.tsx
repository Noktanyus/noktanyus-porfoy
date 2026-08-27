import Link from 'next/link';
import { FaStore, FaArrowLeft } from 'react-icons/fa';

export default function CommerceNotFound() {
  return (
    <div className="container-responsive py-20">
      <div className="max-w-2xl mx-auto glass-card-premium p-8 text-center">
        <FaStore className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">Ürün veya Sayfa Bulunamadı</h2>
        <p className="text-muted-foreground mb-6">
          Aradığınız ürün, plan veya ödeme sayfası mevcut değil. Diğer bölümler (Blog, Projeler) çalışmaya devam ediyor.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/magaza" className="admin-btn admin-btn-primary">
            Mağazaya Dön
          </Link>
          <Link href="/" className="admin-btn admin-btn-secondary">
            <FaArrowLeft /> Anasayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
