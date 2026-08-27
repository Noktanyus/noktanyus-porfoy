'use client';

/**
 * useExperiment - Client tarafinda A/B test hook'u.
 *
 * - Ilk mount'ta /api/experiments/[name] cagirarak sticky variant atamasi yap.
 * - trackConversion() helper'i ile conversion event kaydedebilir.
 * - Session ID sessionStorage'da tutulur (browser session boyunca).
 *
 * Kullanim:
 *   const { variant, config, trackConversion } = useExperiment('pricing-cta');
 *   if (config.ctaColor === 'green') ...
 *   <button onClick={() => trackConversion(99.99)}>Buy</button>
 */

import { useEffect, useState, useCallback, useRef } from 'react';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sid = sessionStorage.getItem('ab-session-id');
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem('ab-session-id', sid);
    }
    return sid;
  } catch {
    // sessionStorage erisim yoksa (private mode vb.) in-memory fallback
    return crypto.randomUUID();
  }
}

interface ExperimentVariantConfig {
  [key: string]: unknown;
}

interface UseExperimentResult {
  variant: string | null;
  config: ExperimentVariantConfig;
  trackConversion: (value?: number, metadata?: Record<string, unknown>) => void;
  sessionId: string;
  loading: boolean;
}

export function useExperiment(experimentName: string): UseExperimentResult {
  const [variant, setVariant] = useState<string | null>(null);
  const [config, setConfig] = useState<ExperimentVariantConfig>({});
  const [loading, setLoading] = useState(true);
  const sessionIdRef = useRef<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sid = getSessionId();
    sessionIdRef.current = sid;

    let cancelled = false;
    setLoading(true);

    fetch(`/api/experiments/${encodeURIComponent(experimentName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sid,
      },
      body: JSON.stringify({ sessionId: sid }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data.data) {
          setVariant(data.data.variantId ?? null);
          setConfig((data.data.config as ExperimentVariantConfig) ?? {});
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [experimentName]);

  const trackConversion = useCallback(
    (value?: number, metadata?: Record<string, unknown>) => {
      const sid = sessionIdRef.current;
      if (!sid || typeof window === 'undefined') return;

      fetch(`/api/conversions/${encodeURIComponent(experimentName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sid,
        },
        body: JSON.stringify({
          sessionId: sid,
          value,
          metadata,
        }),
        // Fire-and-forget; tracking hatasi UX'i bozmamali
        keepalive: true,
      }).catch(() => {
        // Sessizce yut
      });
    },
    [experimentName]
  );

  return {
    variant,
    config,
    trackConversion,
    sessionId: sessionIdRef.current,
    loading,
  };
}
