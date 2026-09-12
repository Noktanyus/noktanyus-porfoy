'use client';

/**
 * @file RedocMount — Client-only Redoc embed
 * @description Redoc standalone bundle'ı CDN'den yükler ve OpenAPI spec'i
 *              /api/openapi'den fetch edip DOM'a mount eder.
 *              npm install redoc GEREKMEZ — Redoc browser bundle'ı zaten CDN'de.
 *
 *              Tema: prefers-color-scheme ile light/dark otomatik geçiş.
 *              CSP: parent layout'ta frame-src 'self' + challenges.cloudflare.com
 *                   var; redoc CDN script 'self' kapsamında değil. Sıkı CSP
 *                   ortamlarında nonce/hash gerekebilir — şu an inline script
 *                   KULLANILMIYOR (sadece external script src).
 */

import { useEffect, useRef, useState } from 'react';

const REDOC_CDN = 'https://cdn.redocly.com/redoc/latest/bundles/redoc.standalone.js';

interface RedocGlobal {
  init: (specUrlOrObject: string | object, mountEl: HTMLElement, opts?: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    Redoc?: RedocGlobal;
  }
}

function loadRedocScript(): Promise<RedocGlobal> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (window.Redoc) return Promise.resolve(window.Redoc);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${REDOC_CDN}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Redoc!));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = REDOC_CDN;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(window.Redoc!);
    script.onerror = () => reject(new Error('Failed to load Redoc CDN bundle'));
    document.head.appendChild(script);
  });
}

export default function RedocMount() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const Redoc = await loadRedocScript();
        if (cancelled || !mountRef.current) return;

        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        Redoc.init(
          '/api/openapi',
          mountRef.current,
          {
            scrollYOffset: 0,
            hideDownloadButton: false,
            expandResponses: '200,201',
            jsonSampleExpandLevel: 2,
            pathInMiddlePanel: true,
            sortPropsAlphabetically: false,
            theme: isDark ? darkTheme : lightTheme,
            nativeScrollbars: false,
          },
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Redoc yüklenemedi');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (mountRef.current) mountRef.current.innerHTML = '';
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
        <p className="font-semibold">API referansı yüklenemedi</p>
        <p className="mt-1">{error}</p>
        <p className="mt-2 text-xs">
          Spec\'i doğrudan görmek için <a href="/api/openapi" className="underline">/api/openapi</a>{' '}
          adresini ziyaret edin.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      data-testid="redoc-mount"
      className="redoc-mount rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 [&>div]:!p-0"
    />
  );
}

// ─── Themes (light + dark) ──────────────────────────────────────────────
// Minimal brand-neutral palette — kırmızı yerine Noktanyus accent tonları.

const lightTheme = {
  typography: {
    fontSize: '15px',
    fontFamily: 'inherit',
    headings: { fontFamily: 'inherit', fontWeight: '600' },
    code: { fontSize: '13px', fontFamily: 'ui-monospace, SFMono-Regular, monospace' },
  },
  sidebar: {
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    activeTextColor: '#2563eb',
    width: '280px',
  },
  rightPanel: { backgroundColor: '#0f172a', textColor: '#e2e8f0' },
  codeBlock: { backgroundColor: '#0f172a' },
  colors: { primary: { main: '#2563eb' } },
};

const darkTheme = {
  ...lightTheme,
  sidebar: {
    ...lightTheme.sidebar,
    backgroundColor: '#0f172a',
    textColor: '#e2e8f0',
  },
};