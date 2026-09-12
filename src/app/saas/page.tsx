/**
 * @file SaaS Landing Page (public)
 * @description Pazarlama sayfası: hero + features + pricing + FAQ + testimonials.
 *              Server component; plan listesi DB'den çekilir. PlanGrid reuse.
 *
 * Faz D:
 *  - Emoji ikonlar react-icons'e taşındı (platformlar arası tutarlılık + a11y).
 *  - Referans (testimonial) bölümü "temsili senaryo" olarak açıkça etiketlendi;
 *    ölçülmüş müşteri metriği gibi sunulmuyor.
 *  - Plan listesi boşsa fallback grid gösterilir (mevcut davranış korundu).
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  FaBolt,
  FaPalette,
  FaFileCsv,
  FaGlobe,
  FaKey,
  FaChartLine,
  FaShieldAlt,
  FaLock,
  FaBrain,
  FaCheck,
} from 'react-icons/fa';
import { commerceService } from '@/modules/commerce';
import { PlanGrid } from '@/components/commerce/PlanGrid';
import { SaasHero } from '@/components/saas/SaasHero';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AI ile Ürün Açıklaması Üret · Noktanyus SaaS',
  description:
    'Saniyeler içinde SEO uyumlu ürün açıklaması. Toplu CSV yükleme, marka sesi eğitimi, 6 dilde yayın.',
};

interface FAQItem {
  q: string;
  a: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    q: 'Ücretsiz plan gerçekten ücretsiz mi?',
    a: 'Evet. Free planda ayda 50 ürün açıklaması üretebilirsiniz, kredi kartı gerekmez. İstediğiniz zaman Pro veya Enterprise plana geçebilirsiniz.',
  },
  {
    q: 'Marka sesi nasıl çalışır?',
    a: 'Mevcut 10 ürününüzün başlık, özellik ve AI tarafından üretilmiş açıklamalarını sisteme girersiniz. AI bu örneklerden ton, kelime haznesi ve CTA kalıbını öğrenir; sonraki tüm üretimlerde aynı sesi kullanır.',
  },
  {
    q: 'CSV toplu yükleme hangi formatta olmalı?',
    a: 'UTF-8 kodlamalı CSV, ilk satır başlık. Minimum sütunlar: title, features. category, audience gibi sütunlar opsiyonel. Maks 5MB, satır başına 100KB önerilir.',
  },
  {
    q: 'Hangi dillerde üretim yapabiliyorsunuz?',
    a: 'Türkçe, İngilizce, Almanca, Fransızca, İspanyolca ve Arapça. Pro plandan itibaren tüm diller açıktır.',
  },
  {
    q: 'API erişimi var mı?',
    a: 'Evet. /saas/dashboard içinden API key oluşturup OpenAPI uyumlu endpointleri kullanabilirsiniz. Dokümantasyon: /api/docs.',
  },
  {
    q: 'Üretilen içeriklerin ticari kullanım hakkı kimde?',
    a: 'Ürettiğiniz tüm açıklamalar %100 size aittir. KVKK & GDPR uyumlu olarak saklanır, üçüncü taraflarla paylaşılmaz.',
  },
];

/**
 * Temsili kullanım senaryoları.
 *
 * ÖNEMLİ: Bunlar ölçülmüş müşteri sonucu DEĞİL, ürünün nasıl kullanıldığını
 * anlatan örnek senaryolardır. Arayüzde de bu şekilde etiketlenir — gerçek
 * metrik gibi sunulmaz.
 */
const USE_CASES = [
  {
    quote: 'Büyük kataloglarda yüzlerce ürün açıklamasını tek CSV ile yenileyin; marka sesiniz her satırda korunur.',
    persona: 'E-ticaret kataloğu',
    role: 'Toplu CSV senaryosu',
  },
  {
    quote: 'Anahtar kelimeleri girin, açıklamalar doğal biçimde bu kelimeleri içerecek şekilde üretilsin.',
    persona: 'İçerik & SEO ekibi',
    role: 'Keyword injection senaryosu',
  },
  {
    quote: 'API anahtarınızla kendi panelinizden üretim tetikleyin; sonuçları kendi veritabanınıza yazın.',
    persona: 'Geliştirici / SaaS',
    role: 'API entegrasyon senaryosu',
  },
];

const TRUST_ITEMS: { icon: ReactNode; label: string }[] = [
  { icon: <FaLock />, label: 'KVKK & GDPR uyumlu' },
  { icon: <FaBrain />, label: 'Claude & GPT-4 destekli' },
  { icon: <FaGlobe />, label: '6 dilde çıktı' },
  { icon: <FaShieldAlt />, label: 'SSO + 2FA hazır' },
];

const FEATURES: { icon: ReactNode; title: string; desc: string }[] = [
  {
    icon: <FaBolt />,
    title: 'Hızlı Üretim',
    desc: 'Tek bir ürün için kısa + uzun açıklama ve SEO etiketleri tek istekte hazır.',
  },
  {
    icon: <FaPalette />,
    title: 'Marka Sesi Eğitimi',
    desc: 'Mevcut içeriklerinizden öğrenen AI, tüm üretimlerinizde tutarlı ses kullanır.',
  },
  {
    icon: <FaFileCsv />,
    title: 'CSV Toplu İşlem',
    desc: 'Yüzlerce ürünü tek CSV ile yükleyin; kuyruk bazlı arka planda işleyin.',
  },
  {
    icon: <FaGlobe />,
    title: '6 Dil Desteği',
    desc: 'TR, EN, DE, FR, ES, AR — tek istekle çift dilli çıktı.',
  },
  {
    icon: <FaKey />,
    title: 'API Erişimi',
    desc: 'REST + OAuth 2.0 PKCE. Mevcut sisteminize dakikalar içinde entegre edin.',
  },
  {
    icon: <FaChartLine />,
    title: 'SEO Keyword Injection',
    desc: 'Ürün başına long-tail keyword önerisi ve doğal yerleştirme.',
  },
];

export default async function SaasLandingPage() {
  let plans: Awaited<ReturnType<typeof commerceService.listPlans>> = [];
  try {
    plans = await commerceService.listPlans();
  } catch {
    plans = [];
  }

  // Statik plan yoksa bile 3'lü fallback grid göster
  const hasPlans = plans.length > 0;

  return (
    <>
      <SaasHero
        eyebrow="Yeni · v2.0 Multi-language"
        title="AI ile Ürün Açıklaması Üret"
        subtitle="Saniyeler içinde SEO uyumlu, marka sesinize özgü ürün açıklamaları. Tek tek veya toplu CSV ile. 6 dilde yayına hazır."
        primaryHref="/kayit"
        primaryLabel="Ücretsiz Başla"
        secondaryHref="/api/docs"
        secondaryLabel="API Dokümantasyonu"
      />

      {/* Trust band */}
      <section aria-label="Uyumluluk ve altyapı" className="border-y border-border bg-muted/40">
        <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:px-8">
          {TRUST_ITEMS.map((item) => (
            <li key={item.label} className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="text-brand-primary">
                {item.icon}
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Tek Platformda Üretim, Eğitim, Yayın
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            E-ticaretten SaaS&apos;a, içerik pazarlamasından katalog yönetimine kadar her ölçekte aynı akış.
          </p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-brand-primary/40"
            >
              <span
                aria-hidden="true"
                className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-xl text-brand-primary"
              >
                {f.icon}
              </span>
              <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/40 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Basit, Şeffaf Fiyatlandırma
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              İstediğiniz planla başlayın, istediğiniz an yükseltin ya da iptal edin.
            </p>
          </div>

          {hasPlans ? (
            <PlanGrid plans={plans} />
          ) : (
            <FallbackPricingGrid />
          )}
        </div>
      </section>

      {/* Kullanım senaryoları — ölçülmüş müşteri metriği DEĞİL, temsili örnek */}
      <section
        aria-labelledby="use-cases-heading"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20"
      >
        <div className="text-center mb-4">
          <h2
            id="use-cases-heading"
            className="text-3xl sm:text-4xl font-bold text-foreground mb-3"
          >
            Nasıl Kullanılıyor?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Sık görülen üç kullanım senaryosu.
          </p>
        </div>
        <p className="mb-10 text-center text-xs text-muted-foreground">
          Aşağıdaki örnekler ürünün kullanım biçimini anlatır; ölçülmüş müşteri
          sonucu veya performans garantisi içermez.
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {USE_CASES.map((t) => (
            <li key={t.persona}>
              <figure className="h-full rounded-2xl border border-border bg-card p-6">
                <blockquote className="mb-4 text-sm leading-relaxed text-foreground/90">
                  {t.quote}
                </blockquote>
                <figcaption className="text-sm">
                  <span className="block font-semibold text-foreground">{t.persona}</span>
                  <span className="block text-muted-foreground">{t.role}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-muted/40 scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Sıkça Sorulan Sorular
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-border bg-card p-5 open:border-brand-primary/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-foreground">
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="ml-3 text-xl text-muted-foreground transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Hemen 50 Ücretsiz Açıklama Hakkınızı Kullanın
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Kayıt 30 saniye. Kredi kartı yok. Dilediğiniz zaman yükseltin.
        </p>
        <Link
          href="/kayit"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-brand-primary px-8 text-base font-semibold text-white shadow-lg transition-all hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Ücretsiz Hesap Oluştur
        </Link>
      </section>
    </>
  );
}

/**
 * Statik planlar gelmediğinde (DB erişilemez veya henüz seed edilmemiş)
 * gösterilen 3'lü fallback grid.
 */
function FallbackPricingGrid() {
  const tiers = [
    {
      name: 'Free',
      price: '₺0',
      interval: 'ay',
      desc: 'Bireysel satıcılar ve deneme için',
      features: ['50 açıklama / ay', 'Türkçe + İngilizce', 'Toplu CSV yok', 'API erişimi yok'],
      cta: 'Ücretsiz Başla',
      href: '/kayit',
      featured: false,
    },
    {
      name: 'Pro',
      price: '₺299',
      interval: 'ay',
      desc: 'Büyüyen e-ticaret markaları için',
      features: ['1.000 açıklama / ay', '6 dilde üretim', 'Marka sesi eğitimi', 'CSV toplu yükleme', 'API erişimi'],
      cta: 'Pro\'ya Geç',
      href: '/kayit?plan=pro',
      featured: true,
    },
    {
      name: 'Enterprise',
      price: '₺999',
      interval: 'ay',
      desc: 'Büyük kataloglar ve SaaS için',
      features: ['Sınırsız açıklama', '6 dil + özel prompt', 'Çoklu marka sesi', 'Öncelikli kuyruk', 'SSO + 2FA', '7/24 destek'],
      cta: 'İletişime Geç',
      href: '/iletisim?subject=enterprise',
      featured: false,
    },
  ];

  return (
    <>
      <p
        role="status"
        className="mx-auto mb-6 max-w-5xl rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-800 dark:text-amber-200"
      >
        Canlı plan listesi şu an yüklenemedi; aşağıda yayınlanmış plan
        kademeleri gösteriliyor. Kesin fiyat ve limitler ödeme adımında
        doğrulanır.
      </p>
      <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((t) => (
          <li
            key={t.name}
            className={`flex flex-col rounded-2xl border bg-card p-6 ${
              t.featured
                ? 'border-brand-primary ring-2 ring-brand-primary/30'
                : 'border-border'
            }`}
          >
            {t.featured && (
              <span className="mb-3 self-start rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-white">
                ÖNERİLEN
              </span>
            )}
            <h3 className="text-2xl font-bold text-foreground">{t.name}</h3>
            <p className="mb-5 mt-1 min-h-[40px] text-sm text-muted-foreground">{t.desc}</p>
            <p className="mb-1 text-4xl font-bold text-brand-primary">
              {t.price}
              <span className="text-base font-normal text-muted-foreground"> /{t.interval}</span>
            </p>
            <ul className="mb-6 mt-5 flex-1 space-y-2 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-foreground/90">
                  <FaCheck
                    aria-hidden="true"
                    className="mt-1 h-3 w-3 shrink-0 text-brand-primary"
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={t.href}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                t.featured
                  ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                  : 'border border-border text-foreground hover:border-brand-primary hover:text-brand-primary'
              }`}
            >
              {t.cta}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
