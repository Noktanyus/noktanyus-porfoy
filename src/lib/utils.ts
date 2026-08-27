/**
 * Yardımcı utility fonksiyonları
 *
 * - cn(): Tailwind class birleştirici
 * - formatCurrency(): Kuruş -> formatlanmış para birimi
 * - formatDate(): Tarih formatlama (varsayılan tr-TR)
 * - generateSlug(): URL-safe slug oluşturma (Türkçe karakter desteği)
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number, currency = 'TRY'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

export function formatDate(
  date: Date | string,
  localeOrOptions: string | Intl.DateTimeFormatOptions = 'tr-TR'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  // İkinci parametre Intl.DateTimeFormatOptions ise, esnek formatlama uygula
  if (typeof localeOrOptions === 'object' && localeOrOptions !== null) {
    return new Intl.DateTimeFormat('tr-TR', localeOrOptions).format(d);
  }

  return new Intl.DateTimeFormat(localeOrOptions, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string, locale = 'tr-TR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}