'use client';

/**
 * Dashboard — Monitör Listesi (CRUD UI)
 */

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaPause,
  FaTrash,
  FaEye,
  FaEdit,
} from 'react-icons/fa';
import { EmptyState } from '@/components/ui/EmptyState';

interface Monitor {
  id: string;
  name: string;
  url: string;
  type: string;
  status: 'UP' | 'DOWN' | 'PAUSED' | 'PENDING';
  intervalSec: number;
  uptimePct30d: number;
  lastResponseMs?: number | null;
  isPublic: boolean;
  publicSlug?: string | null;
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

export function MonitorList({ monitors }: { monitors: Monitor[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Monitörü silmek istediğinize emin misiniz?')) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/monitors/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Silinemedi');
      toast.success('Monitör silindi');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setBusyId(null);
    }
  };

  if (monitors.length === 0) {
    return (
      <EmptyState
        title="Henüz monitör yok"
        description="İlk monitörünüzü oluşturun ve izlemeye başlayın."
        icon="📡"
        action={{ label: 'Yeni Monitör Oluştur', href: '/dashboard/monitors/new' }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {monitors.map((monitor) => {
        const Icon = STATUS_ICON[monitor.status] ?? FaSpinner;
        const color = STATUS_COLOR[monitor.status] ?? 'text-yellow-500';
        const isSpinning = monitor.status === 'PENDING';
        return (
          <div
            key={monitor.id}
            className="glass-card-premium p-5 flex items-center justify-between gap-4"
          >
            <Link
              href={`/dashboard/monitors/${monitor.id}`}
              className="flex items-center gap-4 flex-1 min-w-0"
            >
              <Icon className={`w-5 h-5 ${color} ${isSpinning ? 'animate-spin' : ''}`} />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold truncate">{monitor.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{monitor.url}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
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
            </Link>
            <div className="flex items-center gap-1">
              {monitor.isPublic && monitor.publicSlug && (
                <Link
                  href={`/status/${monitor.publicSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-muted rounded transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                  title="Public Status Page"
                  aria-label={`${monitor.name} public status sayfası`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaEye className="w-4 h-4" aria-hidden="true" />
                </Link>
              )}
              <Link
                href={`/dashboard/monitors/${monitor.id}`}
                className="p-2 hover:bg-muted rounded transition-colors"
                title="Düzenle"
                aria-label={`${monitor.name} monitörünü düzenle`}
              >
                <FaEdit className="w-4 h-4" aria-hidden="true" />
              </Link>
              <button
                onClick={() => handleDelete(monitor.id)}
                disabled={busyId === monitor.id}
                className="p-2 hover:bg-destructive/10 text-destructive rounded transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px]"
                title="Sil"
                aria-label={`${monitor.name} monitörünü sil`}
              >
                <FaTrash className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
