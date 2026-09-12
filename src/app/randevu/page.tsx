import { Metadata } from 'next';
import Link from 'next/link';
import { DS } from '@/lib/design-system';

export const metadata: Metadata = {
  title: 'Randevu / Danışmanlık',
  description:
    'Yazılım danışmanlığı, kod inceleme veya proje keşif görüşmesi planlayın.',
};

const PACKAGES = [
  {
    title: '30 dk Keşif Görüşmesi',
    price: 'Ücretsiz',
    desc: 'Proje ihtiyacını netleştirme, teknik fizibilite ve yol haritası önerisi.',
    cta: { href: '#booking', label: 'Takvimden Seç' },
  },
  {
    title: 'Kod İnceleme',
    price: '₺1.500+',
    desc: 'PR / mimari inceleme, güvenlik ve performans notları (yazılı rapor).',
    cta: { href: '/iletisim', label: 'Teklif İste' },
  },
  {
    title: 'Proje Danışmanlığı',
    price: 'Paket',
    desc: 'Sprint planlama, Next.js / SaaS mimarisi, entegrasyon tasarımı.',
    cta: { href: '/fiyatlandirma', label: 'Planlara Bak' },
  },
] as const;

export default function RandevuPage() {
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL?.trim();

  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 space-y-10 py-4 max-w-4xl mx-auto">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Randevu</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Cal.com / Calendly tarzı randevu. Ortam değişkeni ile kendi takvim linkini
            bağlayabilirsin; yoksa iletişim formu üzerinden talep bırak.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PACKAGES.map((pkg) => (
            <article key={pkg.title} className="glass-card-premium p-5 flex flex-col">
              <h2 className="font-bold text-lg mb-1">{pkg.title}</h2>
              <p className="text-brand-primary font-semibold mb-3">{pkg.price}</p>
              <p className="text-sm text-muted-foreground flex-1 mb-4">{pkg.desc}</p>
              <Link href={pkg.cta.href} className={`${DS.button.secondary} w-full px-4 border border-border`}>
                {pkg.cta.label}
              </Link>
            </article>
          ))}
        </div>

        <section id="booking" className="glass-card-premium p-4 sm:p-6 overflow-hidden">
          <h2 className="text-xl font-bold mb-4">Takvim</h2>
          {bookingUrl ? (
            <iframe
              src={bookingUrl}
              title="Randevu takvimi"
              className="w-full min-h-[640px] rounded-xl border border-border bg-background"
              loading="lazy"
              allow="camera; microphone; fullscreen"
            />
          ) : (
            <div className="text-center py-12 space-y-4">
              <p className="text-muted-foreground max-w-md mx-auto">
                Takvim henüz bağlanmadı. <code className="text-xs bg-muted px-1.5 py-0.5 rounded">NEXT_PUBLIC_BOOKING_URL</code>{' '}
                ile Cal.com veya Calendly embed URL&apos;ini ekle; şimdilik iletişim formunu kullan.
              </p>
              <Link href="/iletisim" className={`${DS.button.primary} px-6`}>
                İletişime Geç
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
