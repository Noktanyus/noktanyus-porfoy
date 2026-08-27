'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import type { Plan } from '@prisma/client';

export function PlanGrid({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-12">
        <p className="text-5xl mb-3" aria-hidden="true">
          💎
        </p>
        <p>Henüz aktif abonelik planı yok.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {plans.map((plan) => {
        const features = Array.isArray(plan.features)
          ? (plan.features as unknown[]).map((f) => String(f))
          : [];
        return (
          <div
            key={plan.id}
            className={`glass-card-premium p-6 flex flex-col ${
              plan.isFeatured ? 'ring-2 ring-brand-primary' : ''
            }`}
          >
            {plan.isFeatured && (
              <span className="inline-block px-3 py-1 rounded-full bg-brand-primary text-white text-xs font-semibold mb-4 self-start">
                ÖNERİLEN
              </span>
            )}
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              {plan.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 min-h-[40px]">
              {plan.description}
            </p>

            <div className="mb-6">
              <span className="text-4xl font-bold text-brand-primary">
                {formatCurrency(plan.priceCents, plan.currency)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">
                /{plan.interval.toLowerCase()}
              </span>
            </div>

            {features.length > 0 && (
              <ul className="space-y-2 mb-6 text-sm flex-1">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-brand-primary mt-0.5" aria-hidden="true">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href={`/odeme/plan?slug=${plan.slug}`}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg transition-all duration-300"
            >
              Planı Seç
            </Link>
          </div>
        );
      })}
    </div>
  );
}
