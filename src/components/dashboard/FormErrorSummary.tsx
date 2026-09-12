'use client';

/**
 * @file FormErrorSummary — Form-level hata özeti banner.
 *
 * Hem üstte özet (ekran okuyucu için), hem de field hatalarını role="alert"
 * ile görünür kılar. Erişilebilirlik:
 * - `role="alert"` + `aria-live="assertive"` ile kritik mesajı hemen duyurur
 * - Madde işaretleri ile her bir alanı ayrı satırda gösterir
 *
 * Kullanım:
 * ```tsx
 * <FormErrorSummary
 *   errors={{ email: 'Geçersiz', password: 'En az 8 karakter' }}
 *   fieldLabels={{ email: 'E-posta', password: 'Şifre' }}
 * />
 * ```
 */

import { useId } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

export interface FormErrorSummaryProps {
  /** Alan adı -> hata mesajı */
  errors: Record<string, string | undefined | null>;
  /** Alan adı -> okunabilir başlık */
  fieldLabels?: Record<string, string>;
  /** Özel başlık (varsayılan: "Lütfen aşağıdaki hataları düzeltin") */
  title?: string;
  /** Ek className */
  className?: string;
}

export function FormErrorSummary({
  errors,
  fieldLabels = {},
  title = 'Lütfen aşağıdaki hataları düzeltin',
  className = '',
}: FormErrorSummaryProps) {
  const headingId = useId();

  const entries = Object.entries(errors).filter(
    ([, msg]) => typeof msg === 'string' && msg.trim().length > 0,
  );

  if (entries.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-labelledby={headingId}
      className={`p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <FaExclamationTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            id={headingId}
            className="font-semibold text-rose-800 dark:text-rose-200"
          >
            {title}
            {entries.length > 0 && (
              <span className="ml-2 text-rose-600 dark:text-rose-400 font-normal">
                ({entries.length})
              </span>
            )}
          </p>
          <ul className="mt-2 space-y-1 text-rose-700 dark:text-rose-300">
            {entries.map(([field, message]) => (
              <li key={field} className="text-xs leading-relaxed">
                <span className="font-medium">
                  {fieldLabels[field] ?? field}:
                </span>{' '}
                <span>{message}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default FormErrorSummary;
