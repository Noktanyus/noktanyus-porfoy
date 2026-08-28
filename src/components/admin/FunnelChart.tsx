'use client';

/**
 * @file Conversion Funnel gorselleştirmesi.
 * @description Her basamagin bar genisligi ONCEKI basamaga gore donusum oranini,
 *              bar icindeki sayi ise mutlak degeri gosterir.
 */

import type { FunnelStage } from '@/modules/analytics/service';

/** Basamak isimlerinin Turkce karsiliklari. */
const STAGE_LABELS: Record<string, string> = {
  Visitors: 'Kullanıcılar',
  Signups: 'Yeni Kayıt',
  Activated: 'Aktive Oldu',
  Orders: 'Sipariş',
  Paid: 'Ödendi',
};

export function FunnelChart({ stages, period }: { stages: FunnelStage[]; period?: number }) {
  return (
    <div className="admin-card">
      <h2 className="text-sm font-semibold mb-1">Dönüşüm Hunisi</h2>
      <p className="text-xs text-muted-foreground mb-4">
        {period ? `Son ${period} gün · ` : ''}Yüzdeler önceki basamağa göredir.
      </p>

      <div className="space-y-2">
        {stages.map((stage) => {
          const width = Math.max(0, Math.min(100, stage.conversionRate));

          return (
            <div key={stage.name} className="flex items-center gap-3">
              <span className="w-24 sm:w-32 text-sm shrink-0">
                {STAGE_LABELS[stage.name] ?? stage.name}
              </span>
              <div className="flex-1 bg-muted rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-primary h-full flex items-center justify-end px-2 text-xs font-medium text-primary-foreground transition-all"
                  style={{ width: `${width}%` }}
                >
                  {stage.value > 0 && <span className="tabular-nums">{stage.value}</span>}
                </div>
                {stage.value > 0 && width < 12 && (
                  <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium tabular-nums">
                    {stage.value}
                  </span>
                )}
              </div>
              <span className="w-16 text-right text-sm font-medium tabular-nums shrink-0">
                {stage.conversionRate.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
