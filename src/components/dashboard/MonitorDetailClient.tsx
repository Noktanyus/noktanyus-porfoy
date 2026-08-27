'use client';

/**
 * Dashboard — Monitör Detayı (Client)
 *
 * - Status badge, uptime, son kontroller
 * - Check/incident timeline görselleştirme
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaPause,
  FaPlay,
  FaTrash,
  FaExternalLinkAlt,
} from 'react-icons/fa';

interface Monitor {
  id: string;
  name: string;
  url: string;
  type: string;
  status: 'UP' | 'DOWN' | 'PAUSED' | 'PENDING';
  intervalSec: number;
  uptimePct30d: number;
  lastResponseMs?: number | null;
  lastCheckedAt?: Date | string | null;
  isPublic: boolean;
  publicSlug?: string | null;
  expectedStatus?: number | null;
  keywordValue?: string | null;
  timeoutSec: number;
}

interface Check {
  id: string;
  timestamp: Date | string;
  isUp: boolean;
  responseMs?: number | null;
  statusCode?: number | null;
  errorMessage?: string | null;
}

interface Incident {
  id: string;
  startedAt: Date | string;
  resolvedAt?: Date | string | null;
  durationSec?: number | null;
  reason: string;
  severity: string;
  affectedChecks: number;
  totalChecks: number;
}

const STATUS_ICON: Record<string, any> = {
  UP: FaCheckCircle,
  DOWN: FaTimesCircle,
  PAUSED: FaPause,
  PENDING: FaSpinner,
};
const STATUS_COLOR: Record<string, string> = {
  UP: 'text-green-500',
  DOWN: 'text-red-500',
  PAUSED: 'text-gray-500',
  PENDING: 'text-yellow-500',
};

export function MonitorDetailClient({
  monitor,
  checks,
  incidents,
}: {
  monitor: Monitor;
  checks: Check[];
  incidents: Incident[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const Icon = STATUS_ICON[monitor.status] ?? FaSpinner;
  const color = STATUS_COLOR[monitor.status] ?? 'text-yellow-500';

  const handleTogglePause = async () => {
    setBusy(true);
    try {
      const newStatus = monitor.status === 'PAUSED' ? 'PENDING' : 'PAUSED';
      const res = await fetch(`/api/monitors/${monitor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Güncellenemedi');
      toast.success(monitor.status === 'PAUSED' ? 'Monitör aktifleştirildi' : 'Monitör duraklatıldı');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Monitörü silmek istediğinize emin misiniz?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/monitors/${monitor.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Silinemedi');
      toast.success('Silindi');
      router.push('/dashboard/monitors');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  };

  const lastCheck = checks[0];
  const openIncidents = incidents.filter((i) => !i.resolvedAt);

  // Son 24 check'i timeline'da göster
  const timeline = checks.slice(0, 24).reverse();

  return (
    <div className="space-y-6">
      <div className="glass-card-premium p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <Icon className={`w-8 h-8 ${color} ${monitor.status === 'PENDING' ? 'animate-spin' : ''}`} />
            <div>
              <h1 className="text-2xl font-bold">{monitor.name}</h1>
              <a
                href={monitor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                {monitor.url}
                <FaExternalLinkAlt className="w-3 h-3" />
              </a>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span className="px-1.5 py-0.5 rounded bg-muted">{monitor.type}</span>
                <span>30g: {monitor.uptimePct30d.toFixed(2)}%</span>
                <span>•</span>
                <span>Her {Math.max(1, Math.round(monitor.intervalSec / 60))}dk</span>
                {monitor.lastResponseMs != null && (
                  <>
                    <span>•</span>
                    <span>{monitor.lastResponseMs}ms</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {monitor.isPublic && monitor.publicSlug && (
              <Link
                href={`/status/${monitor.publicSlug}`}
                target="_blank"
                className="admin-btn admin-btn-secondary"
              >
                Public Page
              </Link>
            )}
            <button
              onClick={handleTogglePause}
              disabled={busy}
              className="admin-btn admin-btn-secondary"
              title={monitor.status === 'PAUSED' ? 'Aktifleştir' : 'Duraklat'}
            >
              {monitor.status === 'PAUSED' ? <FaPlay className="w-3 h-3" /> : <FaPause className="w-3 h-3" />}
              {monitor.status === 'PAUSED' ? 'Aktifleştir' : 'Duraklat'}
            </button>
            <button
              onClick={handleDelete}
              disabled={busy}
              className="admin-btn admin-btn-secondary text-destructive"
            >
              <FaTrash className="w-3 h-3" />
              Sil
            </button>
          </div>
        </div>

        {openIncidents.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
            <p className="font-medium text-red-500">
              Aktif Incident ({openIncidents.length})
            </p>
            <p className="text-xs text-red-500/80 mt-1">{openIncidents[0].reason}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="glass-card-premium p-5">
        <h2 className="font-semibold mb-3">Son 24 Kontrol</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Henüz kontrol yapılmadı
          </p>
        ) : (
          <div className="flex items-end gap-1 h-20">
            {timeline.map((c, idx) => (
              <div
                key={c.id ?? idx}
                className={`flex-1 rounded-t ${c.isUp ? 'bg-green-500' : 'bg-red-500'}`}
                style={{
                  height: c.responseMs ? `${Math.min(100, (c.responseMs / 1000) * 100)}%` : '40%',
                  minHeight: '6px',
                }}
                title={`${new Date(c.timestamp).toLocaleString('tr-TR')} — ${c.isUp ? 'UP' : 'DOWN'} (${c.responseMs ?? 0}ms)`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent checks */}
      <div className="glass-card-premium p-5">
        <h2 className="font-semibold mb-3">Son Kontroller</h2>
        {checks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Henüz veri yok</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border/40">
                  <th className="text-left py-2 px-2">Zaman</th>
                  <th className="text-left py-2 px-2">Durum</th>
                  <th className="text-left py-2 px-2">Kod</th>
                  <th className="text-left py-2 px-2">Süre</th>
                  <th className="text-left py-2 px-2">Hata</th>
                </tr>
              </thead>
              <tbody>
                {checks.slice(0, 20).map((c) => (
                  <tr key={c.id} className="border-b border-border/20">
                    <td className="py-2 px-2 text-xs">
                      {new Date(c.timestamp).toLocaleString('tr-TR')}
                    </td>
                    <td className="py-2 px-2">
                      {c.isUp ? (
                        <span className="text-green-500 text-xs">UP</span>
                      ) : (
                        <span className="text-red-500 text-xs">DOWN</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-xs">{c.statusCode ?? '-'}</td>
                    <td className="py-2 px-2 text-xs">{c.responseMs ?? '-'}ms</td>
                    <td className="py-2 px-2 text-xs text-muted-foreground truncate max-w-xs">
                      {c.errorMessage ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Incidents */}
      <div className="glass-card-premium p-5">
        <h2 className="font-semibold mb-3">Son Incidentlar</h2>
        {incidents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Hiç incident kaydı yok 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {incidents.map((i) => (
              <div
                key={i.id}
                className="p-3 rounded-lg border border-border/40 flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium">{i.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(i.startedAt).toLocaleString('tr-TR')}
                    {i.resolvedAt && ` → ${new Date(i.resolvedAt).toLocaleString('tr-TR')}`}
                  </p>
                </div>
                <div className="text-right">
                  {i.resolvedAt ? (
                    <span className="text-xs text-green-500">{i.durationSec}s</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500">AÇIK</span>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {i.affectedChecks}/{i.totalChecks} check
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
