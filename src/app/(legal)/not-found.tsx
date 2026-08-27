import Link from 'next/link';
import { FaBalanceScale } from 'react-icons/fa';

export default function LegalNotFound() {
  return (
    <div className="container-responsive py-20">
      <div className="max-w-2xl mx-auto glass-card-premium p-8 text-center">
        <FaBalanceScale className="w-12 h-12 mx-auto text-primary mb-3" />
        <h2 className="text-xl font-bold mb-2">Yasal Sayfa Bulunamadı</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Aradığınız yasal sayfa mevcut değil.
        </p>
        <div className="flex gap-2 justify-center">
          <Link href="/yasal" className="admin-btn admin-btn-primary text-sm">
            Yasal Sayfalar
          </Link>
          <Link href="/" className="admin-btn admin-btn-secondary text-sm">
            Anasayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
