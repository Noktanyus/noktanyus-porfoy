/**
 * ComplianceScoreCard — Tek bir site için büyük uyumluluk skoru kartı.
 *
 * Props:
 *   - score: 0-100 arası uyumluluk skoru
 *   - previousScore?: önceki skor (trend oku için)
 *   - siteName: site başlığı
 *   - status: pending | scanning | compliant | warning | critical
 *
 * Renk kodları:
 *   >= 80 → green
 *   50-79 → yellow
 *   < 50  → red
 */

import { FaArrowDown, FaArrowUp, FaMinus } from 'react-icons/fa';

interface ComplianceScoreCardProps {
  score: number | null;
  previousScore?: number | null;
  siteName: string;
  status: string;
}

function getColor(score: number | null): {
  ring: string;
  text: string;
  bg: string;
  label: string;
} {
  if (score == null) {
    return {
      ring: 'ring-gray-300 dark:ring-gray-700',
      text: 'text-gray-500',
      bg: 'bg-gray-50 dark:bg-gray-900/30',
      label: 'Bilinmiyor',
    };
  }
  if (score >= 80) {
    return {
      ring: 'ring-green-500',
      text: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
      label: 'Uyumlu',
    };
  }
  if (score >= 50) {
    return {
      ring: 'ring-yellow-500',
      text: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      label: 'Uyarı',
    };
  }
  return {
    ring: 'ring-red-500',
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    label: 'Kritik',
  };
}

function getStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'compliant':
      return {
        label: 'Uyumlu',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      };
    case 'warning':
      return {
        label: 'Uyarı',
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
      };
    case 'critical':
      return {
        label: 'Kritik',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      };
    case 'scanning':
      return {
        label: 'Taranıyor',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      };
    default:
      return {
        label: 'Beklemede',
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      };
  }
}

export function ComplianceScoreCard({
  score,
  previousScore,
  siteName,
  status,
}: ComplianceScoreCardProps) {
  const color = getColor(score);
  const badge = getStatusBadge(status);
  const trend =
    previousScore != null && score != null
      ? score - previousScore
      : null;

  return (
    <div
      className={`admin-card relative overflow-hidden ${color.bg}`}
      data-testid="compliance-score-card"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Compliance Score
          </p>
          <p className="text-sm font-medium mt-1 line-clamp-1">{siteName}</p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex items-end gap-2">
          <div
            className={`text-6xl font-bold tabular-nums ${color.text} ring-8 ${color.ring} rounded-full w-28 h-28 flex items-center justify-center`}
          >
            {score ?? '—'}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {trend != null && (
            <span
              className={`text-sm font-semibold flex items-center gap-1 ${
                trend > 0
                  ? 'text-green-600 dark:text-green-400'
                  : trend < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500'
              }`}
            >
              {trend > 0 ? (
                <FaArrowUp className="w-3 h-3" aria-hidden="true" />
              ) : trend < 0 ? (
                <FaArrowDown className="w-3 h-3" aria-hidden="true" />
              ) : (
                <FaMinus className="w-3 h-3" aria-hidden="true" />
              )}
              {trend > 0 ? '+' : ''}
              {trend}
            </span>
          )}
          <span className={`text-sm font-medium ${color.text}`}>{color.label}</span>
        </div>
      </div>
    </div>
  );
}
