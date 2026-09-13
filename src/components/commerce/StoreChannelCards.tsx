'use client';

/**
 * Mağaza iki satış kanalı — bireysel kullanıcıya net dil.
 * Hazır paketler (tek sefer) | Aylık hizmetler (abonelik)
 */

import Link from 'next/link';
import { FaBoxOpen, FaCalendarCheck, FaArrowRight, FaDownload, FaKey, FaHeadset } from 'react-icons/fa';

const CHANNELS = [
  {
    href: '/magaza/urunler',
    title: 'Hazır paketler',
    eyebrow: 'Tek seferlik',
    description:
      'Portföy şablonları, script ve dijital paketler. Bir kez al, indir, kullan.',
    points: ['Şablon & PayTR starter', 'TR SDK & KVKK metinleri', 'Anında indirme + lisans'],
    icon: FaBoxOpen,
    accent: 'from-slate-900 via-sky-900 to-teal-800',
    cta: 'Paketlere bak',
  },
  {
    href: '/magaza/abonelikler',
    title: 'API & hizmetler',
    eyebrow: 'Aylık abonelik',
    description:
      'API erişimi ve hesap özellikleri. Bireysel, Profesyonel veya Destek+ seç.',
    points: ['Tevkifat · kıdem · iş günü', 'E-posta MX & fatura PDF', 'İstediğin zaman iptal'],
    icon: FaCalendarCheck,
    accent: 'from-slate-900 via-emerald-900 to-lime-800',
    cta: 'Planları gör',
  },
] as const;

export function StoreChannelCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {CHANNELS.map((ch) => {
        const Icon = ch.icon;
        return (
          <Link
            key={ch.href}
            href={ch.href}
            className="group relative overflow-hidden rounded-3xl min-h-[320px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${ch.accent} transition-transform duration-500 group-hover:scale-[1.02]`}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_55%)]" aria-hidden="true" />
            <div className="relative z-10 flex h-full flex-col p-7 sm:p-9 text-white">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                  {ch.eyebrow}
                </span>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <h2 className="mt-6 text-3xl sm:text-4xl font-bold tracking-tight">{ch.title}</h2>
              <p className="mt-3 text-sm sm:text-base text-white/80 max-w-md leading-relaxed">
                {ch.description}
              </p>
              <ul className="mt-6 space-y-2 text-sm text-white/85">
                {ch.points.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
              <span className="mt-auto pt-8 inline-flex items-center gap-2 text-sm font-semibold">
                {ch.cta}
                <FaArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function StoreTrustStrip() {
  return (
    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
      {[
        {
          icon: FaDownload,
          title: 'Anında teslim',
          text: 'Hazır paketlerde lisans ve indirme linki ödeme sonrası gelir.',
        },
        {
          icon: FaKey,
          title: 'Kolay erişim',
          text: 'Aylık hizmetlerde API key ve özellikler hesabına bağlanır.',
        },
        {
          icon: FaHeadset,
          title: 'Tek satıcı',
          text: 'Tüm paket ve hizmetler Noktanyus tarafından yayınlanır.',
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

export default StoreChannelCards;
