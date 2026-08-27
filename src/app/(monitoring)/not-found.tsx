import Link from 'next/link';
import { FaHeartbeat, FaArrowLeft } from 'react-icons/fa';

export default function MonitoringNotFound() {
  return (
    <main className="min-h-screen bg-blob-decoration">
      <div className="container-responsive py-20">
        <div className="max-w-2xl mx-auto glass-card-premium p-8 text-center">
          <FaHeartbeat className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Status Sayfası Bulunamadı</h2>
          <p className="text-muted-foreground mb-6">
            Aradığınız status sayfası mevcut değil. Diğer bölümler normal çalışıyor.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/" className="admin-btn admin-btn-primary">
              Anasayfa
            </Link>
            <Link href="/saglik" className="admin-btn admin-btn-secondary">
              <FaArrowLeft /> Sistem Sağlığı
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
