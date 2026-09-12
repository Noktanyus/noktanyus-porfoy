/**
 * @file /saglik — Modül sağlık durumu (public status) sayfası.
 *
 * Veri kaynağı `/api/health/modules`. Sayfa hiçbir değer uydurmaz; endpoint
 * erişilemezse bunu açıkça söyler.
 *
 * Faz D:
 *  - İç içe `<main>` kaldırıldı (kök layout zaten main landmark render ediyor).
 *  - Durum göstergeleri ortak `StatusBadge` + `resolveHealthStatus` eşlemesine
 *    taşındı; 'degraded' durumu artık DOĞRU gösteriliyor (önceden `up`
 *    olmayan her şey kırmızı "çalışmıyor" olarak çiziliyordu).
 *  - Endpoint erişilemediğinde düz metin yerine `ErrorDisplay`.
 *  - Modül listesi boşsa `EmptyState`.
 */

import { FaHeartbeat } from 'react-icons/fa';
import CardBody from '@/components/ui/CardBody';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, resolveHealthStatus } from '@/components/ui/StatusBadge';

export const dynamic = 'force-dynamic';

interface ModuleStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latency: number;
  details: {
    description?: string;
    error?: string;
  };
}

interface HealthResponse {
  status: string;
  timestamp: string;
  totalLatency: number;
  modules: ModuleStatus[];
}

async function getModuleStatus(): Promise<HealthResponse | null> {
  try {
    const baseUrl =
      process.env.NEXTAUTH_URL ??
      process.env.NEXT_PUBLIC_BASE_URL ??
      'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/health/modules`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}

/** Teknik modül adı → kullanıcı dostu etiket. */
const MODULE_LABELS: Record<string, string> = {
  content: 'Blog + Projeler',
  commerce: 'Mağaza + Ödeme',
  monitoring: 'Uptime + Status',
  messaging: 'İletişim + Newsletter',
};

export default async function HealthPage() {
  const data = await getModuleStatus();

  return (
    <div className="bg-blob-decoration">
      <div className="container-responsive py-12">
        <div className="mb-12 text-center">
          <FaHeartbeat aria-hidden="true" className="mx-auto mb-3 h-16 w-16 text-primary" />
          <h1 className="mb-2 text-4xl font-bold">Sistem Sağlığı</h1>
          <p className="text-muted-foreground">Tüm modüllerin anlık durumu</p>
          {data && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Son kontrol: {new Date(data.timestamp).toLocaleString('tr-TR')} · Toplam{' '}
              {data.totalLatency}ms
            </p>
          )}
        </div>

        {!data ? (
          <ErrorDisplay
            variant="card"
            title="Sağlık durumu okunamadı"
            message="Durum servisine şu an ulaşılamıyor. Bu, servislerin çalışmadığı anlamına gelmeyebilir — birkaç dakika sonra tekrar deneyin."
            showHomeLink
            className="mx-auto max-w-xl"
          />
        ) : data.modules.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="İzlenen modül yok"
            description="Sağlık servisi çalışıyor ancak kayıtlı modül döndürmedi."
            className="mx-auto max-w-xl"
          />
        ) : (
          <ul className="mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
            {data.modules.map((m) => {
              const badge = resolveHealthStatus(m.status);
              return (
                <li key={m.name}>
                  <article className="glass-card-premium h-full overflow-hidden rounded-xl">
                    <CardBody>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="font-semibold">
                            {MODULE_LABELS[m.name] ?? m.name}
                          </h2>
                          {m.details?.description && (
                            <p className="text-xs text-muted-foreground">
                              {m.details.description}
                            </p>
                          )}
                          {m.details?.error && (
                            <p className="mt-1 break-all font-mono text-xs text-rose-600 dark:text-rose-400">
                              {m.details.error}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <StatusBadge
                            size="sm"
                            tone={badge.tone}
                            dot
                            label={badge.label}
                            srLabel={`${MODULE_LABELS[m.name] ?? m.name} durumu:`}
                          />
                          <p className="font-mono text-xs tabular-nums text-muted-foreground">
                            {m.latency}ms
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </article>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            JSON API: <code className="font-mono">/api/health</code> ·{' '}
            <code className="font-mono">/api/health/modules</code>
          </p>
        </div>
      </div>
    </div>
  );
}
