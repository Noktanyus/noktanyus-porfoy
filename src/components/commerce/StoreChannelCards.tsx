/**
 * Mağaza satış kanalları.
 * Birincil teklif: TR yardımcı API — aylık plan (Bireysel/Profesyonel) veya ön ödemeli kredi.
 * İkincil kanal: hazır dijital paketler.
 */

import Link from 'next/link';
import { FaBoxOpen, FaCalendarCheck, FaCoins, FaArrowRight, FaKey, FaHeadset } from 'react-icons/fa';
import { INDIVIDUAL_PLANS } from '@/lib/individualPlans';
import { API_CREDIT_PACKS } from '@/lib/apiCredits';
import { formatCurrency } from '@/lib/utils';

const trNumber = (value: number) => value.toLocaleString('tr-TR');

/** Kotalı planlar (Destek+ sınırsız olduğu için vitrin özetinde yer almaz) */
const QUOTA_PLANS = INDIVIDUAL_PLANS.filter(
  (plan) => typeof (plan.limits as Record<string, number>).apiRequestsPerMonth === 'number'
);

const planEntryPrice = Math.min(...INDIVIDUAL_PLANS.map((plan) => plan.priceCents));
const creditEntryPack = API_CREDIT_PACKS.reduce((cheapest, pack) =>
  pack.priceCents < cheapest.priceCents ? pack : cheapest
);

const PRIMARY_CHANNELS = [
  {
    href: '/magaza/abonelikler',
    title: 'Aylık API planı',
    eyebrow: 'Sabit kota · en çok tercih edilen',
    price: `${formatCurrency(planEntryPrice, 'try')} / ay’dan başlar`,
    description:
      'TR yardımcı API’ye tek bir API key ile bağlan: doğrulama, KDV/tevkifat, kıdem, iş günü ve PDF. Kotan her ay yenilenir.',
    points: [
      ...QUOTA_PLANS.map(
        (plan) =>
          `${plan.name}: ${trNumber(
            (plan.limits as Record<string, number>).apiRequestsPerMonth
          )} istek / ay`
      ),
      'API key ödeme sonrası açılır',
      'İstediğin zaman iptal',
    ],
    icon: FaCalendarCheck,
    accent: 'from-slate-900 via-emerald-900 to-teal-800',
    cta: 'Planları karşılaştır',
  },
  {
    href: '/magaza/krediler',
    title: 'API kredisi',
    eyebrow: 'Kullandığın kadar · aboneliksiz',
    price: `${formatCurrency(creditEntryPack.priceCents, creditEntryPack.currency)}’dan başlar`,
    description:
      'Düzenli kotaya ihtiyacın yoksa bakiye yükle, aynı API’yi istek başına kullan. Bakiyenin süresi dolmaz.',
    points: [
      `En küçük paket: ${trNumber(creditEntryPack.credits)} kredi`,
      '1 kredi = 1 başarılı istek',
      'Abonelik zorunlu değil',
    ],
    icon: FaCoins,
    accent: 'from-slate-900 via-amber-900 to-orange-800',
    cta: 'Kredi yükle',
  },
] as const;

export function StoreChannelCards() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {PRIMARY_CHANNELS.map((ch) => {
          const Icon = ch.icon;
          const PointIcon = ch.href.includes('kredi') ? FaCoins : FaKey;
          return (
            <Link
              key={ch.href}
              href={ch.href}
              className="group relative overflow-hidden rounded-3xl min-h-[300px] flex flex-col justify-end p-6 sm:p-8 text-white shadow-lg transition hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${ch.accent}`} aria-hidden />
              <div className="absolute inset-0 bg-black/20" aria-hidden />
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-2 flex items-center gap-2">
                  <Icon className="opacity-90" aria-hidden />
                  {ch.eyebrow}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">{ch.title}</h2>
                <p className="text-sm font-semibold text-white mb-3">{ch.price}</p>
                <p className="text-sm text-white/85 mb-4 max-w-sm">{ch.description}</p>
                <ul className="space-y-1.5 text-sm text-white/90 mb-5">
                  {ch.points.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <PointIcon className="shrink-0 opacity-70" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  {ch.cta}
                  <FaArrowRight className="transition group-hover:translate-x-1" aria-hidden />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/magaza/urunler"
        className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-border/60 bg-background/60 px-5 py-4 transition hover:border-brand-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <FaBoxOpen className="h-4 w-4 text-foreground" aria-hidden />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            İkincil kanal · tek seferlik
          </span>
          <span className="block font-semibold text-foreground">Hazır paketler</span>
          <span className="block text-sm text-muted-foreground mt-0.5">
            API dışında kalan küçük dijital paketler: şablon, script ve hazır metin setleri. Bir kez
            al, indir, kullan.
          </span>
        </span>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary shrink-0">
          Paketlere bak
          <FaArrowRight className="transition group-hover:translate-x-1" aria-hidden />
        </span>
      </Link>
    </div>
  );
}

export function StoreTrustStrip() {
  return (
    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
      {[
        {
          icon: FaKey,
          title: 'Aynı API, iki ödeme yolu',
          text: 'Aylık plan sabit kota verir, kredi istek başına düşer. İkisi birlikte de çalışır.',
        },
        {
          icon: FaCoins,
          title: 'Önce yükle, sonra kullan',
          text: 'Plan kotası veya kredi bakiyesi olmadan API isteği açılmaz.',
        },
        {
          icon: FaHeadset,
          title: 'Tek satıcı',
          text: 'Planlar, krediler ve hazır paketler Noktanyus tarafından yayınlanır.',
        },
      ].map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="rounded-2xl border border-border/60 bg-background/60 px-5 py-4">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted mb-3">
              <Icon className="h-4 w-4 text-foreground" aria-hidden="true" />
            </div>
            <p className="font-semibold text-foreground">{item.title}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.text}</p>
          </div>
        );
      })}
    </div>
  );
}
