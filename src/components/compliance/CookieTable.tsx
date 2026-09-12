/**
 * CookieTable — Çerez tablosu (type badges ile).
 */

import { FaCookieBite } from 'react-icons/fa';

export interface CookieRow {
  name: string;
  provider?: string;
  purpose?: string;
  duration?: string;
  type: 'necessary' | 'analytics' | 'marketing';
  exemptFromConsent?: boolean;
}

interface CookieTableProps {
  cookies: CookieRow[];
}

const TYPE_META: Record<
  CookieRow['type'],
  { label: string; className: string }
> = {
  necessary: {
    label: 'Zorunlu',
    className:
      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  analytics: {
    label: 'Analitik',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  marketing: {
    label: 'Pazarlama',
    className:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  },
};

export function CookieTable({ cookies }: CookieTableProps) {
  if (cookies.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <FaCookieBite className="w-10 h-10 mx-auto mb-3 opacity-50" aria-hidden="true" />
        <p>Hiç çerez tespit edilmedi.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto admin-card p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <th scope="col" className="text-left p-3 font-medium">İsim</th>
            <th scope="col" className="text-left p-3 font-medium">Sağlayıcı</th>
            <th scope="col" className="text-left p-3 font-medium">Amaç</th>
            <th scope="col" className="text-left p-3 font-medium">Süre</th>
            <th scope="col" className="text-left p-3 font-medium">Kategori</th>
          </tr>
        </thead>
        <tbody>
          {cookies.map((cookie, idx) => {
            const meta = TYPE_META[cookie.type];
            return (
              <tr
                key={`${cookie.name}-${idx}`}
                className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30"
              >
                <td className="p-3 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    {cookie.name}
                    {cookie.exemptFromConsent && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded">
                        Muaf
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {cookie.provider ?? '—'}
                </td>
                <td className="p-3 text-xs">{cookie.purpose ?? '—'}</td>
                <td className="p-3 text-xs">{cookie.duration ?? '—'}</td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
