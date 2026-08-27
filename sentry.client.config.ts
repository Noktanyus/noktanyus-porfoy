/**
 * Sentry istemci tarafı yapılandırması.
 * Bu dosya tarayıcıda çalışır; NEXT_PUBLIC_SENTRY_DSN ortam değişkeni ile kontrol edilir.
 */

import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // Performance monitoring — sample 10% of transactions
    tracesSampleRate: 0.1,
    // Profiling — sample 10% of profiled sessions
    profilesSampleRate: 0.1,
    // Session replay sampling
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    // Reduce bundle bloat by disabling unneeded integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}