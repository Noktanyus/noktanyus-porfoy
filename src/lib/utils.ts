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

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-transparent',
  secondary: 'bg-muted text-foreground border border-border hover:bg-muted/80',
  outline: 'border-2 border-primary text-primary bg-transparent hover:bg-primary/10',
  ghost: 'bg-transparent text-foreground border border-transparent hover:bg-muted',
  danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm border border-transparent',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  // min-h değerleri WCAG 2.2 AA (2.5.8 Target Size) için dokunmatik hedef sağlar
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2 text-base min-h-[44px]',
  lg: 'px-6 py-3 text-lg min-h-[48px]',
};

/**
 * Tutarlı kontrastlı buton class'ı üretir.
 *
 * Beyaz arka planda kaybolan butonlar sorununu çözmek için her varyant
 * dolu zemin veya belirgin kenarlık taşır. `cn()` ile birleştirildiği için
 * çağıran taraf ek class ile override edebilir (tailwind-merge çakışmayı çözer).
 *
 * @example
 * <button className={getButtonClass('primary', 'md')}>Kaydet</button>
 * <Link className={cn(getButtonClass('secondary', 'md'), 'w-full')}>Geri</Link>
 */
export function getButtonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md'
): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
    'transition-colors focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-primary focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size]
  );
}