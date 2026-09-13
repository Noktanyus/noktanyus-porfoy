/**
 * @file MonitorStatusCard — Public status sayfası monitör kartı.
 * @description Sunucu bileşeni (client JS yok). Yalnızca herkese açık
 *              alanları gösterir: ad, durum, 30 günlük uptime, son kontrol
 *              zamanı ve son kontrollerin başarı/başarısızlık şeridi.
 *              Monitör URL'i, hata mesajları ve sahip bilgisi bilinçli olarak
 *              dışarı verilmez.
 */

import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';

export interface PublicCheck {
  id: string;
  timestamp: Date | string;
  isUp: boolean;
  responseMs?: number | null;
}

export interface PublicMonitor {
  id: string;
  name: string;
  status: string;
  uptimePct30d: number;
  lastCheckedAt?: Date | string | null;
  lastResponseMs?: number | null;
  checks: PublicCheck[];
}

interface StatusMeta {
  label: string;
  tone: StatusTone;
}

export const MONITOR_STATUS_META: Record<string, StatusMeta> = {
  UP: { label: 'Çalışıyor', tone: 'success' },
  DOWN: { label: 'Kesinti var', tone: 'danger' },
  PAUSED: { label: 'Duraklatıldı', tone: 'neutral' },
  PENDING: { label: 'Ölçüm bekleniyor', tone: 'info' },
};

export function resolveMonitorStatus(status: string): StatusMeta {
  return MONITOR_STATUS_META[status] ?? { label: 'Bilinmiyor', tone: 'neutral' };
}

/** Sunucuda sabit saat dilimiyle biçimlendirme — çıktı deterministik kalır. */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return 'Henüz kontrol edilmedi';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Bilinmiyor';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Istanbul',
  }).format(date);
}

export function MonitorStatusCard({ monitor }: { monitor: PublicMonitor }) {
  const statusMeta = resolveMonitorStatus(monitor.status);
  const headingId = `monitor-${monitor.id}-heading`;

  // Şeritte en eski kontrol solda, en yeni sağda görünür.
  const timeline = [...monitor.checks].reverse();
  const upCount = timeline.filter((check) => check.isUp).length;
  const downCount = timeline.length - upCount;

  return (
    <section
      aria-labelledby={headingId}
      className="glass-card-premium p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3
            id={headingId}
            className="font-semibold text-gray-900 dark:text-white break-words"
          >
            {monitor.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Son kontrol: {formatDateTime(monitor.lastCheckedAt)}
            {monitor.lastResponseMs != null && ` • ${monitor.lastResponseMs}ms`}
          </p>
        </div>
        <StatusBadge
          label={statusMeta.label}
          tone={statusMeta.tone}
          dot
          srLabel={`${monitor.name} durumu: `}
        />
      </div>

      <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
        <span className="font-semibold">{monitor.uptimePct30d.toFixed(2)}%</span>{' '}
        <span className="text-muted-foreground">son 30 gün çalışma süresi</span>
      </p>

      {timeline.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Bu servis için henüz kontrol kaydı yok.
        </p>
      ) : (
        <>
          <div
            role="img"
            aria-label={`Son ${timeline.length} kontrol: ${upCount} başarılı, ${downCount} başarısız. Soldan sağa eskiden yeniye sıralı.`}
            className="mt-3 flex items-stretch gap-[2px] h-10"
          >
            {timeline.map((check) => (
              <span
                key={check.id}
                aria-hidden="true"
                title={`${formatDateTime(check.timestamp)} — ${check.isUp ? 'Çalışıyor' : 'Kesinti'}`}
                className={`flex-1 min-w-[3px] rounded-sm ${
                  check.isUp ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>{formatDateTime(timeline[0]?.timestamp)}</span>
            <span>{formatDateTime(timeline[timeline.length - 1]?.timestamp)}</span>
          </div>
        </>
      )}
    </section>
  );
}

export default MonitorStatusCard;
