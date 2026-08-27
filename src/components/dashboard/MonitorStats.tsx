'use client';

/**
 * Dashboard — Monitör istatistik kartları
 */

import { FaCheckCircle, FaTimesCircle, FaPause, FaSpinner } from 'react-icons/fa';

interface Stats {
  total: number;
  up: number;
  down: number;
  paused: number;
  pending: number;
  avgUptime: number;
}

export function MonitorStats({ stats }: { stats: Stats }) {
  const items = [
    { label: 'Çalışıyor', value: stats.up, color: 'text-green-500', icon: FaCheckCircle },
    { label: 'Çalışmıyor', value: stats.down, color: 'text-red-500', icon: FaTimesCircle },
    { label: 'Beklemede', value: stats.pending, color: 'text-yellow-500', icon: FaSpinner },
    { label: 'Duraklatılmış', value: stats.paused, color: 'text-gray-500', icon: FaPause },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div key={it.label} className="glass-card-premium p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${it.color}`} />
              <p className="text-xs text-muted-foreground">{it.label}</p>
            </div>
            <p className="text-2xl font-bold">{it.value}</p>
          </div>
        );
      })}
    </div>
  );
}
