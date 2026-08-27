'use client';

/**
 * @file Audit log client component
 * @description Filtreleme + pagination için client component.
 *              Server component (page.tsx) veriyi getirir ve bu componente prop olarak geçer.
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';

interface AuditItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  status: string;
  errorMessage: string | null;
  timestamp: string;
}

interface AuditStats {
  total: number;
  today: number;
  failures: number;
  byAction: { action: string; count: number }[];
}

interface AuditClientPageProps {
  items: AuditItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: AuditStats;
  currentFilters: {
    action: string;
    resource: string;
    userId: string;
    status: string;
  };
}

const ACTIONS = [
  '', 'CREATE', 'UPDATE', 'DELETE',
  'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
  'PUBLISH', 'UNPUBLISH',
  'EXPORT', 'IMPORT',
  'GIT_COMMIT', 'GIT_REVERT', 'GIT_CHECKOUT',
  'IMAGE_UPLOAD', 'IMAGE_DELETE',
  'SETTINGS_UPDATE',
];

const STATUSES = ['', 'success', 'failure'];

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  failure: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  UPDATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  LOGIN: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  LOGIN_FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  GIT_COMMIT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  SETTINGS_UPDATE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  IMAGE_UPLOAD: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  IMAGE_DELETE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  EXPORT: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  PUBLISH: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  UNPUBLISH: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

export function AuditClientPage({
  items,
  total,
  page,
  pageSize,
  totalPages,
  stats,
  currentFilters,
}: AuditClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const buildHref = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null) params.delete(k);
      else params.set(k, String(v));
    });
    return `${pathname}?${params.toString()}`;
  };

  const handleFilterChange = (key: string, value: string) => {
    startTransition(() => {
      router.push(buildHref({ [key]: value, page: 1 }));
    });
  };

  const goPage = (p: number) => {
    startTransition(() => {
      router.push(buildHref({ page: p }));
    });
  };

  return (
    <div className="space-y-6">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Toplam Kayıt" value={stats.total} />
        <StatCard label="Bugün" value={stats.today} accent="text-blue-600 dark:text-blue-400" />
        <StatCard label="Başarısız" value={stats.failures} accent="text-red-600 dark:text-red-400" />
        <StatCard label="Sayfa Başına" value={pageSize} accent="text-gray-600 dark:text-gray-400" />
      </div>

      {/* Filtre Çubuğu */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-4 border border-gray-200 dark:border-dark-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FilterSelect
            label="İşlem"
            value={currentFilters.action}
            options={ACTIONS.map((a) => ({ value: a, label: a || 'Tümü' }))}
            onChange={(v) => handleFilterChange('action', v)}
          />
          <FilterSelect
            label="Resource"
            value={currentFilters.resource}
            options={[
              { value: '', label: 'Tümü' },
              { value: 'Blog', label: 'Blog' },
              { value: 'Project', label: 'Project' },
              { value: 'Popup', label: 'Popup' },
              { value: 'About', label: 'About' },
              { value: 'Message', label: 'Message' },
              { value: 'HomeSettings', label: 'HomeSettings' },
              { value: 'SeoSettings', label: 'SeoSettings' },
              { value: 'Git', label: 'Git' },
              { value: 'blog', label: 'blog (content)' },
              { value: 'projects', label: 'projects (content)' },
              { value: 'popups', label: 'popups (content)' },
              { value: 'about', label: 'about (content)' },
              { value: 'skills', label: 'skills (content)' },
              { value: 'experiences', label: 'experiences (content)' },
              { value: 'testimonials', label: 'testimonials (content)' },
            ]}
            onChange={(v) => handleFilterChange('resource', v)}
          />
          <FilterInput
            label="Kullanıcı (email/id)"
            value={currentFilters.userId}
            onChange={(v) => handleFilterChange('userId', v)}
          />
          <FilterSelect
            label="Durum"
            value={currentFilters.status}
            options={STATUSES.map((s) => ({ value: s, label: s || 'Tümü' }))}
            onChange={(v) => handleFilterChange('status', v)}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {total} kayıttan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} arası gösteriliyor
          </span>
          {isPending && <span className="animate-pulse">Yükleniyor...</span>}
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
        {items.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            Filtrelerle eşleşen kayıt bulunamadı.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((log) => (
              <li key={log.id} className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start gap-2 lg:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {log.action}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[log.status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {log.status}
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                        {log.resource}
                      </span>
                      {log.resourceId && (
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded truncate max-w-[200px]">
                          {log.resourceId}
                        </span>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                      <div>
                        <strong>Kullanıcı:</strong>{' '}
                        {log.userEmail ?? log.userId ?? '— (anonim)'}
                      </div>
                      <div>
                        <strong>Zaman:</strong>{' '}
                        <time dateTime={log.timestamp}>
                          {new Date(log.timestamp).toLocaleString('tr-TR')}
                        </time>
                      </div>
                      {log.ipAddress && (
                        <div className="truncate">
                          <strong>IP:</strong> {log.ipAddress}
                        </div>
                      )}
                      {log.errorMessage && (
                        <div className="text-red-600 dark:text-red-400 break-words">
                          <strong>Hata:</strong> {log.errorMessage}
                        </div>
                      )}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 select-none">
                            Detayları göster
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-50 dark:bg-gray-900/50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => goPage(page - 1)}
            disabled={page <= 1 || isPending}
            className="px-3 py-2 rounded-lg bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            ← Önceki
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Sayfa {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goPage(page + 1)}
            disabled={page >= totalPages || isPending}
            className="px-3 py-2 rounded-lg bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            Sonraki →
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-3 sm:p-4">
      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`text-xl sm:text-2xl font-bold mt-1 ${accent ?? 'text-gray-900 dark:text-gray-100'}`}>
        {value.toLocaleString('tr-TR')}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        {options.map((opt) => (
          <option key={opt.value || 'all'} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="email@example.com"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
      />
    </label>
  );
}
