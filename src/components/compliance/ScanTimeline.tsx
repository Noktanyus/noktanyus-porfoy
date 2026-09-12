/**
 * ScanTimeline — Dikey scan zaman çizelgesi component'i.
 */

import {
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaClock,
} from 'react-icons/fa';

export interface ScanTimelineEntry {
  id: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string | Date;
  completedAt?: string | Date | null;
  score?: number | null;
  pagesScanned?: number;
  durationMs?: number | null;
  errorMessage?: string | null;
}

interface ScanTimelineProps {
  scans: ScanTimelineEntry[];
}

function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec} sn`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min} dk ${rem} sn`;
}

function getStatusMeta(status: ScanTimelineEntry['status']) {
  switch (status) {
    case 'completed':
      return {
        icon: FaCheckCircle,
        color: 'text-green-500',
        bg: 'bg-green-100 dark:bg-green-900/40',
        label: 'Tamamlandı',
      };
    case 'failed':
      return {
        icon: FaTimesCircle,
        color: 'text-red-500',
        bg: 'bg-red-100 dark:bg-red-900/40',
        label: 'Başarısız',
      };
    case 'running':
      return {
        icon: FaSpinner,
        color: 'text-blue-500 animate-spin',
        bg: 'bg-blue-100 dark:bg-blue-900/40',
        label: 'Çalışıyor',
      };
    default:
      return {
        icon: FaClock,
        color: 'text-gray-500',
        bg: 'bg-gray-100 dark:bg-gray-800',
        label: 'Bilinmiyor',
      };
  }
}

export function ScanTimeline({ scans }: ScanTimelineProps) {
  if (scans.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <FaClock className="w-10 h-10 mx-auto mb-3 opacity-50" aria-hidden="true" />
        <p>Henüz tarama yapılmadı.</p>
      </div>
    );
  }

  return (
    <ol className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 space-y-6">
      {scans.map((scan) => {
        const meta = getStatusMeta(scan.status);
        const Icon = meta.icon;
        return (
          <li key={scan.id} className="ml-6 relative">
            <span
              className={`absolute -left-[2.4rem] flex items-center justify-center w-8 h-8 rounded-full ${meta.bg} ring-4 ring-white dark:ring-gray-900`}
            >
              <Icon className={`w-4 h-4 ${meta.color}`} aria-hidden="true" />
            </span>
            <div className="admin-card p-4">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(scan.startedAt)}
                  </p>
                </div>
                {scan.score != null && (
                  <span
                    className={`text-2xl font-bold tabular-nums ${
                      scan.score >= 80
                        ? 'text-green-600'
                        : scan.score >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {scan.score}
                  </span>
                )}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Sayfa</p>
                  <p className="font-medium">{scan.pagesScanned ?? 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Süre</p>
                  <p className="font-medium">{formatDuration(scan.durationMs)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tamamlandı</p>
                  <p className="font-medium">
                    {scan.completedAt ? formatDate(scan.completedAt) : '—'}
                  </p>
                </div>
              </div>
              {scan.errorMessage && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {scan.errorMessage}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
