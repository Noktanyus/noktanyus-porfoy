/**
 * @file PlanSelectorStep - 3-step kayıt sihirbazının 2. adımı
 * @description Kullanıcı Bireysel / Profesyonel / Destek+ planlarından birini seçer
 *              ve kullanım koşullarını kabul eder.
 *
 * @ai-note Bu component Server Component değildir; form state'i useState ile
 *          tutulduğu için "use client" ile işaretlenmiştir. Üst component
 *          (RegisterWizard) ile `value/onChange` callback'leri üzerinden haberleşir.
 */

"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Plan tanımı - şimdilik hardcoded. İleride API'den dinamik çekilebilir.
 * features JSON array olarak ileride schema'dan parse edilebilir.
 */
import type { OnboardingPlan } from "@/modules/onboarding/schemas";

/**
 * Plan tanımı - şimdilik hardcoded. İleride API'den dinamik çekilebilir.
 * features JSON array olarak ileride schema'dan parse edilebilir.
 */
export interface PlanOption {
  /** Plan slug - Zod OnboardingPlanSchema ile uyumlu */
  slug: OnboardingPlan;
  /** Görünür isim */
  name: string;
  /** Kısa açıklama */
  description: string;
  /** Aylık fiyat (cent cinsinden). 0 = ücretsiz/trial */
  priceCents: number;
  /** Para birimi ISO 4217 */
  currency: string;
  /** Plan kısa özellik listesi */
  features: string[];
  /** Öne çıkan plan (örn. "En popüler") rozeti gösterir */
  isFeatured?: boolean;
  /** Trial gün sayısı */
  trialDays: number;
}

export const PLAN_OPTIONS: PlanOption[] = [
  {
    slug: "starter",
    name: "Starter",
    description: "TR yardımcı API — 2.000 aylık kota.",
    priceCents: 9900,
    currency: "try",
    trialDays: 14,
    features: [
      "2.000 API isteği / ay",
      "VKN · IBAN · telefon · KDV",
      "E-posta destek",
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    description: "Yüksek kota ve öncelikli destek.",
    priceCents: 29900,
    currency: "try",
    trialDays: 14,
    isFeatured: true,
    features: [
      "10.000 API isteği / ay",
      "PDF + plaka + banka çözümü",
      "Öncelikli destek",
    ],
  },
  {
    slug: "business",
    name: "Business",
    description: "Gelişmiş operasyon ve yüksek kota.",
    priceCents: 99900,
    currency: "try",
    trialDays: 14,
    features: [
      "50.000 API isteği / ay",
      "Öncelikli SLA desteği",
      "Gelişmiş webhooklar",
    ],
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    description: "Özel kota + SLA + Danışmanlık.",
    priceCents: 0,
    currency: "try",
    trialDays: 0,
    features: [
      "Özel API kotası",
      "Birebir mimari destek",
      "7/24 SLA",
    ],
  },
];

export interface PlanSelectorStepProps {
  /** Şu an seçili plan slug'ı */
  value: OnboardingPlan;
  /** Plan değiştiğinde çağrılır */
  onChange: (slug: OnboardingPlan) => void;
  /** Kullanım koşulları kabul durumu */
  acceptTerms: boolean;
  /** acceptTerms değiştiğinde çağrılır */
  onAcceptTermsChange: (accepted: boolean) => void;
  /** Form gönderilirken disabled etmek için */
  disabled?: boolean;
}

/**
 * Fiyatı "29,90 ₺ / ay" gibi okunabilir formata çevirir.
 * Bu küçük helper component'in içinde tutulur; tekrar kullanım gerektiğinde
 * `@/lib/utils` içine taşınabilir.
 */
function formatPrice(priceCents: number, currency: string): string {
  if (priceCents === 0) return "Ücretsiz";
  const amount = (priceCents / 100).toFixed(2).replace(".", ",");
  const symbols: Record<string, string> = { try: "₺", usd: "$", eur: "€" };
  return `${amount} ${symbols[currency.toLowerCase()] ?? currency.toUpperCase()}`;
}

export function PlanSelectorStep({
  value,
  onChange,
  acceptTerms,
  onAcceptTermsChange,
  disabled = false,
}: PlanSelectorStepProps) {
  // useId ile label-input eşleşmesini sağla (a11y)
  const termsId = useId();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Planını seç
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Tüm planlar {PLAN_OPTIONS[0].trialDays} gün ücretsiz dene ile başlar.
          İstediğin zaman iptal edebilirsin.
        </p>
      </div>

      {/* Plan kartları */}
      <div
        role="radiogroup"
        aria-label="Plan seçimi"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {PLAN_OPTIONS.map((plan) => {
          const isSelected = value === plan.slug;
          return (
            <button
              key={plan.slug}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => !disabled && onChange(plan.slug)}
              disabled={disabled}
              className={cn(
                // Base
                "relative w-full text-left rounded-xl border p-4 transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                "dark:focus-visible:ring-offset-slate-900",
                // Selected / unselected
                isSelected
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-400 ring-1 ring-indigo-600 dark:ring-indigo-400"
                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-700",
                // Disabled
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {plan.isFeatured && (
                <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold uppercase tracking-wide">
                  Önerilen
                </span>
              )}

              <div className="flex items-baseline justify-between mb-1">
                <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {plan.name}
                </span>
                {isSelected && (
                  <span
                    className="text-indigo-600 dark:text-indigo-400"
                    aria-hidden="true"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 min-h-[32px]">
                {plan.description}
              </p>

              <div className="mb-3">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatPrice(plan.priceCents, plan.currency)}
                </span>
                {plan.priceCents > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {" "}
                    / ay
                  </span>
                )}
              </div>

              <ul className="space-y-1">
                {plan.features.slice(0, 3).map((feat) => (
                  <li
                    key={feat}
                    className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5"
                  >
                    <span
                      className="text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Kullanım koşulları onayı */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
        <label
          htmlFor={termsId}
          className="flex items-start gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
        >
          <input
            id={termsId}
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => onAcceptTermsChange(e.target.checked)}
            disabled={disabled}
            className={cn(
              "mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600",
              "focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0",
              "dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-offset-slate-900",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
          <span>
            <a
              href="/yasal/kvkk"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              KVKK
            </a>{" "}
            ve{" "}
            <a
              href="/yasal/mesafeli-satis"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Mesafeli Satış Sözleşmesi
            </a>
            &apos;ni okudum, kabul ediyorum.
          </span>
        </label>
      </div>
    </div>
  );
}
