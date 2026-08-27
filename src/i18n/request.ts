/**
 * @file next-intl server-side istek konfigürasyonu.
 * @description Her istek için uygun dilin yüklenmesini sağlar.
 */

import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale, defaultLocale, isLocale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Next.js 15'te requestLocale bir Promise olabilir; güvenli şekilde çöz.
  const requested = await requestLocale;
  const locale: Locale = isLocale(requested) ? requested : defaultLocale;

  let messages: Record<string, unknown>;
  try {
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return {
    locale,
    messages,
    timeZone: 'Europe/Istanbul',
    now: new Date(),
  };
});
