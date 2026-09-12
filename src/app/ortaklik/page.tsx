import { Metadata } from 'next';
import Link from 'next/link';
import { DS } from '@/lib/design-system';

export const metadata: Metadata = {
  title: 'Ortaklık / Affiliate',
  description:
    'Noktanyus ürünlerini öner, satışlardan komisyon kazan. Affiliate referral programı.',
};

const STEPS = [
  {
    title: '1. Hesap aç',
    body: 'Ücretsiz kayıt ol, dashboard içinden affiliate panelini aç.',
  },
  {
    title: '2. Linkini paylaş',
    body: 'Kişisel ?ref= kodunla mağaza ve fiyatlandırma sayfalarını paylaş.',
  },
  {
    title: '3. Komisyon kazan',
    body: 'Başarılı satışlarda komisyon hesabına işlenir; payout talep edebilirsin.',
  },
] as const;

export default function OrtaklikPage() {
  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 max-w-3xl mx-auto space-y-10 py-4">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Affiliate Ortaklık</h1>
          <p className="text-muted-foreground leading-relaxed">
            Piyasada kanıtlanmış referral modeli: dijital ürün ve abonelik satışlarından
            komisyon. Teknik altyapı hazır — sen paylaş, sistem takip etsin.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title} className="glass-card-premium p-5">
              <h2 className="font-bold mb-2">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="glass-card-premium p-6 sm:p-8 text-center space-y-4">
          <p className="text-muted-foreground">
            Komisyon oranları ve payout geçmişi giriş yaptıktan sonra dashboard&apos;da
            görünür.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/kayit" className={`${DS.button.primary} px-6`}>
              Ortak Ol · Kayıt
            </Link>
            <Link href="/dashboard/affiliate" className={`${DS.button.secondary} px-6 border border-border`}>
              Affiliate Paneli
            </Link>
            <Link href="/magaza" className={`${DS.button.ghost} px-6`}>
              Ürünleri Gör
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
