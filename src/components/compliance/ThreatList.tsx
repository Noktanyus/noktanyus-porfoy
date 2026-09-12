/**
 * ThreatList — KVKK/GDPR tehdit listesi (Severity grouped, collapsible fix).
 */

'use client';

import { useState } from 'react';
import {
  FaChevronDown,
  FaChevronUp,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaShieldAlt,
} from 'react-icons/fa';

export interface Threat {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  description: string;
  regulationRef?: string;
  fixSuggestion?: string;
  pageUrl?: string;
}

interface ThreatListProps {
  threats: Threat[];
}

const SEVERITY_ORDER: Threat['severity'][] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const SEVERITY_META: Record<
  Threat['severity'],
  {
    label: string;
    className: string;
    icon: typeof FaExclamationCircle;
  }
> = {
  CRITICAL: {
    label: 'Kritik',
    className:
      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
    icon: FaExclamationCircle,
  },
  HIGH: {
    label: 'Yüksek',
    className:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    icon: FaExclamationTriangle,
  },
  MEDIUM: {
    label: 'Orta',
    className:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    icon: FaExclamationTriangle,
  },
  LOW: {
    label: 'Düşük',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: FaInfoCircle,
  },
};

export function ThreatList({ threats }: ThreatListProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  if (threats.length === 0) {
    return (
      <div className="admin-card text-center py-10">
        <FaShieldAlt className="w-12 h-12 text-green-500 mx-auto mb-3" aria-hidden="true" />
        <p className="text-lg font-medium">Tehdit bulunamadı</p>
        <p className="text-sm text-muted-foreground mt-1">
          Bu taramada KVKK/GDPR ihlali tespit edilmedi.
        </p>
      </div>
    );
  }

  // Group by severity
  const grouped = SEVERITY_ORDER.map((severity) => ({
    severity,
    items: threats.filter((t) => t.severity === severity),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-3">
      {grouped.map((group) => {
        const meta = SEVERITY_META[group.severity];
        const Icon = meta.icon;
        return (
          <div
            key={group.severity}
            className={`rounded-lg border ${meta.className.split(' ')[2] || ''} overflow-hidden`}
          >
            <div className={`px-4 py-2 ${meta.className} flex items-center gap-2`}>
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span className="font-semibold">{meta.label}</span>
              <span className="ml-auto text-xs">{group.items.length} tehdit</span>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {group.items.map((threat, idx) => {
                const globalIdx = threats.indexOf(threat);
                const isOpen = expanded[globalIdx];
                return (
                  <li key={`${threat.type}-${idx}`} className="p-4">
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [globalIdx]: !prev[globalIdx] }))
                      }
                      className="w-full flex items-start justify-between gap-3 text-left"
                      aria-expanded={isOpen}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{threat.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                            {threat.type}
                          </code>
                          {threat.regulationRef && (
                            <span className="ml-2 italic">{threat.regulationRef}</span>
                          )}
                        </p>
                      </div>
                      {threat.fixSuggestion &&
                        (isOpen ? (
                          <FaChevronUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        ) : (
                          <FaChevronDown className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        ))}
                    </button>
                    {isOpen && threat.fixSuggestion && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-900 dark:text-blue-200">
                        <p className="font-medium mb-1">Önerilen Çözüm:</p>
                        <p>{threat.fixSuggestion}</p>
                        {threat.pageUrl && (
                          <p className="mt-2 text-xs">
                            <span className="font-medium">Sayfa:</span>{' '}
                            <code className="break-all">{threat.pageUrl}</code>
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
