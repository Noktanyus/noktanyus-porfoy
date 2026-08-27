/**
 * Sentry istemci tarafı yapılandırması.
 * Bu dosya tarayıcıda çalışır; NEXT_PUBLIC_SENTRY_DSN ortam değişkeni ile kontrol edilir.
 */

import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  });
}