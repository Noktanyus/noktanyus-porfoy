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

export function formatDate(date: Date | string, locale = 'tr-TR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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