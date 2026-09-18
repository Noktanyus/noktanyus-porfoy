'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { parsePlanFeatures } from '@/lib/schemas/plan';
import { intervalLabel } from '@/lib/individualPlans';
import type { Plan } from '@prisma/client';
import { DS } from '@/lib/design-system';

export function PlanGrid({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) {
    return (
      <div className="text-center text-slate-500 dark:text-slate-400 py-12">
        <p>Henüz aktif aylık plan yok.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {plans.map((plan) => {
        const features = parsePlanFeatures(plan.features);
        const marketing = features.marketing ?? [];
        const apiRequests =
          features.limits?.apiRequestsPerMonth ?? features.limits?.aiRequestsPerMonth;
        return (
          <div
            key={plan.id}
            className={`glass-card-premium p-6 flex flex-col min-w-0 ${
              plan.isFeatured ? 'ring-2 ring-brand-primary' : ''
            }`}
          >
            {plan.isFeatured && (
              <span className="inline-block px-3 py-1 rounded-md bg-brand-primary text-white text-xs font-semibold mb-4 self-start">
                Önerilen
              </span>
            )}
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">
              TR yardımcı API
            </p>
            <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white break-words">
              {plan.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 sm:min-h-[40px] break-words">
              {plan.description}
            </p>

            <div className="mb-6 flex flex-wrap items-baseline gap-x-2">
              {plan.priceCents > 0 ? (
                <>
                  <span className="text-3xl sm:text-4xl font-bold text-brand-primary break-words">
                    {formatCurrency(plan.priceCents, plan.currency)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    / {intervalLabel(plan.interval)}
                  </span>
                </>
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-brand-primary break-words">
                  Teklif Usulü
                </span>
              )}
            </div>

            {marketing.length > 0 && (
              <ul className="space-y-2 mb-6 text-sm flex-1">
                {marketing.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <span className="text-brand-primary mt-0.5 shrink-0" aria-hidden="true">
                      ✓
                    </span>
                    <span className="min-w-0 break-words">{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {apiRequests !== undefined && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold mb-1 text-foreground">Kota (aylık)</p>
                <p>
                  API istek:{' '}
                  <span className="tabular-nums font-medium">
                    {Number.isFinite(apiRequests)
                      ? apiRequests.toLocaleString('tr-TR')
                      : 'Özel Kurumsal Kota'}
                  </span>
                </p>
              </div>
            )}

            {plan.slug === 'enterprise' || plan.priceCents === 0 ? (
              <Link
                href="/iletisim?plan=enterprise"
                aria-label={`${plan.name} için teklif alın`}
                className={`${DS.button.primary} w-full text-center`}
              >
                Teklif Alın & İletişim
              </Link>
            ) : (
              <Link
                href={`/odeme/plan?slug=${plan.slug}`}
                aria-label={`${plan.name} planına başla`}
                className={`${DS.button.primary} w-full text-center`}
              >
                Kolayca başla
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
