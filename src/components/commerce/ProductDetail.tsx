'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { productCategoryLabel } from '@/lib/storeCatalog';
import type { DigitalProduct } from '@prisma/client';
import type { LicensePricingTier } from '@/modules/commerce/types';

export function ProductDetail({ product }: { product: DigitalProduct }) {
  const techs = Array.isArray(product.technologies)
    ? (product.technologies as unknown[]).map((t) => String(t))
    : [];
  const requirements = Array.isArray(product.requirements)
    ? (product.requirements as unknown[]).map((r) => String(r))
    : [];

  const reqObj =
    typeof product.requirements === 'object' && product.requirements !== null && !Array.isArray(product.requirements)
      ? (product.requirements as Record<string, unknown>)
      : null;

  const isLicenseProduct =
    product.category === 'license' ||
    reqObj?.deliveryType === 'license_only' ||
    Boolean(reqObj?.thirdPartyAppName);

  const pricingTiers: LicensePricingTier[] = Array.isArray(reqObj?.pricingTiers)
    ? (reqObj?.pricingTiers as LicensePricingTier[])
    : [];

  // Default to popular tier if marked, otherwise first tier, otherwise null
  const defaultTier = pricingTiers.find((t) => t.isPopular) || pricingTiers[0] || null;
  const [selectedTier, setSelectedTier] = useState<LicensePricingTier | null>(defaultTier);

  const activationInstructions =
    typeof reqObj?.activationInstructions === 'string' ? reqObj.activationInstructions : null;
  const externalAppUrl =
    typeof reqObj?.externalAppUrl === 'string' && reqObj.externalAppUrl ? reqObj.externalAppUrl : null;
  const maxActivations =
    typeof reqObj?.maxActivations === 'number' ? reqObj.maxActivations : null;

  const currentPriceCents = selectedTier ? selectedTier.priceCents : product.priceCents;
  const checkoutHref = selectedTier
    ? `/odeme?slug=${encodeURIComponent(product.slug)}&tier=${encodeURIComponent(selectedTier.id)}&days=${selectedTier.days}`
    : `/odeme?slug=${encodeURIComponent(product.slug)}`;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/magaza" className="hover:text-foreground">
          Mağaza
        </Link>
        <span className="mx-1.5 opacity-60">/</span>
        <Link href="/magaza/urunler" className="hover:text-foreground">
          Hazır paketler
        </Link>
        <span className="mx-1.5 opacity-60">/</span>
        <span className="text-foreground line-clamp-1 inline">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden border border-gray-200/60 dark:border-gray-700/60">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Görsel yok
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap gap-1 mb-3">
            <span className="text-xs px-2 py-1 rounded-md bg-brand-primary/10 text-brand-primary font-medium">
              {productCategoryLabel(product.category)}
            </span>
            <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground font-medium">
              {isLicenseProduct ? 'Lisans Anahtarı' : 'Tek seferlik'}
            </span>
            {product.version && (
              <span className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                v{product.version}
              </span>
            )}
            {product.featured && (
              <span className="text-xs px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                Öne çıkan
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {product.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            {product.shortDescription}
          </p>

          {/* Pricing Tiers Selection (if multiple options configured) */}
          {pricingTiers.length > 0 && (
            <div className="mb-6 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Lisans Süresi ve Fiyat Seçenekleri
                </label>
                <span className="text-xs text-muted-foreground">
                  {selectedTier ? selectedTier.label : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {pricingTiers.map((tier) => {
                  const isSelected = selectedTier?.id === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedTier(tier)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all relative select-none ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/25 shadow-sm'
                          : 'border-border/70 hover:border-brand-primary/40 hover:bg-muted/30'
                      }`}
                    >
                      {tier.isPopular && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                          EN POPÜLER
                        </span>
                      )}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground">
                          {tier.label}
                        </span>
                        <span className="font-bold text-sm text-brand-primary">
                          {formatCurrency(tier.priceCents, product.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                        <span>
                          {tier.days === 0 ? '♾️ Süresiz / Ömür Boyu' : `⏱️ ${tier.days} gün`}
                        </span>
                        {tier.description && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {tier.description}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-brand-primary">
              {formatCurrency(currentPriceCents, product.currency)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">KDV dahil</span>
            {selectedTier && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-medium">
                {selectedTier.label}
              </span>
            )}
          </div>

          <Link
            href={checkoutHref}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 min-h-[48px]"
          >
            <span>Hemen Satın Al</span>
            {selectedTier && (
              <span className="text-sm font-normal opacity-90">
                ({formatCurrency(selectedTier.priceCents, product.currency)})
              </span>
            )}
          </Link>

          <div className="mt-6 space-y-3 text-sm">
            {isLicenseProduct ? (
              <>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span aria-hidden="true">🔑</span>
                  <span>Anında otomatik lisans anahtarı üretimi ve teslimi</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span aria-hidden="true">🛡️</span>
                  <span>3. parti / harici uygulama doğrulama desteği</span>
                </div>
                {selectedTier && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span aria-hidden="true">⏱️</span>
                    <span>
                      Kullanım Süresi:{' '}
                      <strong>
                        {selectedTier.days === 0 ? 'Süresiz / Ömür Boyu' : `${selectedTier.days} Gün`}
                      </strong>
                    </span>
                  </div>
                )}
                {maxActivations && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span aria-hidden="true">📱</span>
                    <span>Maksimum {maxActivations} cihazda aktivasyon hakkı</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span aria-hidden="true">📦</span>
                  <span>Anında teslim ({product.ttlHours} saat indirme bağlantısı)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span aria-hidden="true">🔄</span>
                  <span>En fazla {product.downloadCountMax} kez indirebilirsiniz</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span aria-hidden="true">🔒</span>
              <span>Güvenli ödeme (PayTR)</span>
            </div>
          </div>

          {externalAppUrl && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <a
                href={externalAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline font-medium"
              >
                <span>Uygulamayı İndir / Harici Sayfaya Git ↗</span>
              </a>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="lg:col-span-2 mt-8">
          <div className="glass-card-premium p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Açıklama
            </h2>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {product.description}
              </p>
            </div>

            {activationInstructions && (
              <div className="mt-6 p-4 rounded-xl border border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20">
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2">
                  <span>🔑</span>
                  <span>Aktivasyon ve Doğrulama Talimatı</span>
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {activationInstructions}
                </p>
              </div>
            )}

            {techs.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white">
                  Teknolojiler
                </h3>
                <div className="flex flex-wrap gap-2">
                  {techs.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </>
            )}

            {requirements.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white">
                  Gereksinimler
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
