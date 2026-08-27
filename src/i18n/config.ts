/**
 * @file i18n yapılandırma dosyası.
 * @description Desteklenen dilleri, varsayılan dili ve görünen etiket/bayrakları tanımlar.
 */

export const locales = ['tr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'tr';

export const localeLabels: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
};

/**
 * next-intl'in desteklediği biçimde locale listesi.
 */
export const localeList = locales;

/**
 * Verilen string'in geçerli bir Locale olup olmadığını kontrol eder.
 */
export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
