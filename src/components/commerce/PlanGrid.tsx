'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { parsePlanFeatures } from '@/lib/schemas/plan';
import type { Plan } from '@prisma/client';
import { DS } from '@/lib/design-system';

export function PlanGrid({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) {
    return (
      <div className="text-center text-slate-500 dark:text-slate-400 py-12">
        <p className="text-5xl mb-3" aria-hidden="true">
          💎
        </p>
        <p>Henüz aktif abonelik planı yok.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {plans.map((plan) => {
        const features = parsePlanFeatures(plan.features);
        const marketing = features.marketing ?? [];
        const aiTokens = features.limits?.aiTokensPerMonth;
        const aiRequests = features.limits?.aiRequestsPerMonth;
        return (
          <div
            key={plan.id}
            /* min-w-0: grid item'ın varsayılan `min-width:auto` değeri uzun
               kelimelerin kolonu genişletip yatay taşma yapmasını engeller */
            className={`glass-card-premium p-6 flex flex-col min-w-0 ${
              plan.isFeatured ? 'ring-2 ring-indigo-500' : ''
            }`}
          >
            {plan.isFeatured && (
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold mb-4 self-start">
                ÖNERİLEN
              </span>
            )}
            <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white break-words">
              {plan.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 sm:min-h-[40px] break-words">
              {plan.description}
            </p>

            <div className="mb-6 flex flex-wrap items-baseline gap-x-2">
              <span className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400 break-words">
                {formatCurrency(plan.priceCents, plan.currency)}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                /{plan.interval.toLowerCase()}
              </span>
            </div>

            {marketing.length > 0 && (
              <ul className="space-y-2 mb-6 text-sm flex-1">
                {marketing.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <span className="text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" aria-hidden="true">
                      ✓
                    </span>
                    <span className="min-w-0 break-words">{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {(aiTokens !== undefined || aiRequests !== undefined) && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold mb-1 text-indigo-700 dark:text-indigo-300">AI Limitleri</p>
                {aiTokens !== undefined && (
                  <p>
                    Token:{' '}
                    <span className="tabular-nums font-medium">
                      {Number.isFinite(aiTokens) ? `${(aiTokens / 1000).toFixed(0)}K` : 'Sınırsız'}
                    </span>{' '}
                    / ay
                  </p>
                )}
                {aiRequests !== undefined && (
                  <p>
                    İstek:{' '}
                    <span className="tabular-nums font-medium">
                      {Number.isFinite(aiRequests) ? aiRequests : 'Sınırsız'}
                    </span>{' '}
                    / ay
                  </p>
                )}
              </div>
            )}

            <Link
              href={`/odeme/plan?slug=${plan.slug}`}
              aria-label={`${plan.name} planını seç`}
              className={`${DS.button.primary} w-full`}
            >
              Planı Seç
            </Link>
          </div>
        );
      })}
    </div>
  );
}
