'use client';

import { FaBolt, FaGift, FaShieldAlt, FaCheckDouble } from 'react-icons/fa';
import { WELCOME_CREDITS, formatWelcomeCredits } from '@/lib/apiCredits';

const ITEMS = [
  {
    icon: FaBolt,
    title: 'Sub-ms yanıt',
    description: 'Yerel doğrulama uçları milisaniye altında tamamlanır.',
  },
  {
    icon: FaGift,
    title: `${formatWelcomeCredits(WELCOME_CREDITS)} hediye kredi`,
    description: 'Kayıt + e-posta doğrulama sonrası anında deneme bakiyesi.',
  },
  {
    icon: FaShieldAlt,
    title: 'KVKK uyumlu',
    description: 'Kişisel veri saklamadan algoritmik doğrulama.',
  },
  {
    icon: FaCheckDouble,
    title: 'ISO & GİB kuralları',
    description: 'IBAN MOD-97, TCKN/VKN checksum, resmi tevkifat oranları.',
  },
] as const;

export default function HomeTrustStrip() {
  return (
    <section
      className="py-2 sm:py-4"
      aria-label="Neden Noktanyus API"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {ITEMS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex gap-3 rounded-2xl border border-border/70 bg-card/50 dark:bg-slate-900/40 px-4 py-3.5 backdrop-blur-sm"
          >
            <span
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/12 text-brand-primary border border-brand-primary/20"
              aria-hidden="true"
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">{title}</p>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
