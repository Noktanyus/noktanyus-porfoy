import Link from 'next/link';
import type { Plan } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';
import { parsePlanFeatures, effectiveApiRequestLimit } from '@/lib/schemas/plan';
import { intervalLabel } from '@/lib/individualPlans';

/**
 * Feature × plan karşılaştırma tablosu — SaaS pricing matrix.
 */
export function PlanCompareMatrix({ plans }: { plans: Plan[] }) {
  if (plans.length < 2) return null;

  const sorted = [...plans].sort((a, b) => a.order - b.order || a.priceCents - b.priceCents);
  const rows = sorted.map((plan) => {
    const features = parsePlanFeatures(plan.features);
    const api = effectiveApiRequestLimit(features.limits);
    return {
      plan,
      api,
      marketing: features.marketing.slice(0, 6),
      featured: plan.isFeatured,
    };
  });

  return (
    <section className="mt-12 max-w-5xl mx-auto" aria-labelledby="plan-compare-title">
      <div className="mb-6 text-center space-y-2">
        <h2 id="plan-compare-title" className="text-2xl font-extrabold tracking-tight">
          Plan karşılaştırması
        </h2>
        <p className="text-sm text-muted-foreground">
          Kota, fiyat ve öne çıkan özellikler — tek bakışta.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-muted/40 text-left">
              <th className="p-3 font-semibold">Özellik</th>
              {rows.map(({ plan, featured }) => (
                <th
                  key={plan.id}
                  className={`p-3 font-semibold ${featured ? 'bg-brand-primary/5' : ''}`}
                >
                  {plan.name}
                  {featured && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-brand-primary">
                      önerilen
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="p-3 text-muted-foreground">Fiyat</td>
              {rows.map(({ plan }) => (
                <td key={plan.id} className="p-3 font-bold tabular-nums">
                  {plan.priceCents > 0
                    ? `${formatCurrency(plan.priceCents, plan.currency)} / ${intervalLabel(plan.interval)}`
                    : 'Teklif'}
                </td>
              ))}
            </tr>
            <tr className="border-t border-border bg-muted/20">
              <td className="p-3 text-muted-foreground">Aylık API isteği</td>
              {rows.map(({ plan, api }) => (
                <td key={plan.id} className="p-3 tabular-nums font-semibold">
                  {api != null ? api.toLocaleString('tr-TR') : '—'}
                </td>
              ))}
            </tr>
            <tr className="border-t border-border">
              <td className="p-3 text-muted-foreground align-top">Öne çıkanlar</td>
              {rows.map(({ plan, marketing }) => (
                <td key={plan.id} className="p-3 align-top">
                  <ul className="space-y-1 text-xs sm:text-sm">
                    {marketing.length === 0 ? (
                      <li className="text-muted-foreground">—</li>
                    ) : (
                      marketing.map((m) => (
                        <li key={m} className="flex gap-1.5">
                          <span className="text-brand-primary" aria-hidden="true">
                            ✓
                          </span>
                          <span>{m}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </td>
              ))}
            </tr>
            <tr className="border-t border-border">
              <td className="p-3" />
              {rows.map(({ plan }) => (
                <td key={plan.id} className="p-3">
                  <Link
                    href={`/magaza/abonelikler#plan-${plan.slug}`}
                    className="inline-flex min-h-[40px] items-center rounded-xl bg-brand-primary px-3 py-2 text-xs font-semibold text-white hover:bg-brand-primary/90"
                  >
                    Seç
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
