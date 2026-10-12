'use client';

/**
 * @file DocsNav — Birleşik Dokümantasyon Navigasyon Çubuğu
 * @description Parçalanmış docs sayfalarını tek bir çatı altında birleştiren,
 *              tüm /docs rotalarında aktif sekmeyi gösteren ve OpenAPI / Postman
 *              hızlı indirme linklerini sunan navigasyon bileşeni.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaBook,
  FaExclamationTriangle,
  FaClock,
  FaCode,
  FaBell,
  FaRobot,
  FaHistory,
  FaKey,
  FaDownload,
  FaExternalLinkAlt,
} from 'react-icons/fa';

export const DOCS_SECTIONS = [
  {
    href: '/docs',
    label: 'API Referansı',
    icon: FaBook,
    description: '132 endpoint, istek/yanıt şemaları ve interaktif gezgin',
  },
  {
    href: '/docs/hatalar',
    label: 'Hata Kodları',
    icon: FaExclamationTriangle,
    description: 'Hata sözleşmesi, HTTP durumları ve retry politikası',
  },
  {
    href: '/docs/rate-limits',
    label: 'Rate Limits & Kota',
    icon: FaClock,
    description: 'Dakikalık limitler, başlıklar ve kota yönetimi',
  },
  {
    href: '/docs/sdk',
    label: 'SDK Kütüphaneleri',
    icon: FaCode,
    description: 'TypeScript / Node, Python ve Go resmi istemcileri',
  },
  {
    href: '/docs/webhooks',
    label: 'Webhooks',
    icon: FaBell,
    description: 'HMAC imza doğrulama, olay tipleri ve retry akışı',
  },
  {
    href: '/docs/mcp',
    label: 'MCP & AI Ajanları',
    icon: FaRobot,
    description: 'Model Context Protocol, agent araçları ve keşif uçları',
  },
  {
    href: '/docs/versioning',
    label: 'Versiyonlama',
    icon: FaHistory,
    description: 'Sözleşme tarihleri, deprecation ve sunset başlıkları',
  },
];

export function DocsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Dokümantasyon navigasyonu" className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/95 shadow-sm relative z-20 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-2.5">
          {/* Sekmeler — Yatay kaydırılabilir */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
            {DOCS_SECTIONS.map((sec) => {
              const isActive = pathname === sec.href;
              const Icon = sec.icon;

              return (
                <Link
                  key={sec.href}
                  href={sec.href}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-sm shadow-brand-primary/25 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900'
                  }`}
                  title={sec.description}
                >
                  <Icon className={`text-xs ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{sec.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Hızlı Eylemler (Masaüstü) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0 text-xs">
            <Link
              href="/dashboard/api-keys"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-primary/30 bg-brand-primary/5 text-brand-primary font-semibold hover:bg-brand-primary/10 transition-colors"
            >
              <FaKey className="text-[10px]" />
              <span>API Key Al</span>
            </Link>
            <a
              href="/api/openapi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <FaExternalLinkAlt className="text-[10px]" />
              <span>openapi.json</span>
            </a>
            <a
              href="/api/openapi/postman"
              download
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <FaDownload className="text-[10px]" />
              <span>Postman</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
