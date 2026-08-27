/**
 * Yapılandırılmış loglama için merkezi logger.
 *
 * - JSON formatında log üretir (Log aggregator'lar için kolay parse)
 * - Production'da debug loglarını bastırır
 * - error() seviyesinde Sentry'ye exception gönderir (Sentry init edildiyse)
 */

import * as Sentry from '@sentry/nextjs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private format(level: LogLevel, message: string, context?: LogContext) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context ?? {}),
    };
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug(JSON.stringify(this.format('debug', message, context)));
    }
  }

  info(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    console.info(JSON.stringify(this.format('info', message, context)));
  }

  warn(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify(this.format('warn', message, context)));
  }

  error(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(this.format('error', message, context)));

    // Sentry'ye gönder (Sentry henüz init edilmediyse captureException no-op olur)
    try {
      Sentry.captureException(new Error(message), {
        extra: (context ?? {}) as Record<string, unknown>,
      });
    } catch {
      // Sentry yüklenmemişse sessizce yut
    }
  }
}

export const logger = new Logger();