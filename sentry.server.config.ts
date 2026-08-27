/**
 * Sentry sunucu tarafı yapılandırması (Node.js runtime API rotaları için).
 */

import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  });
}