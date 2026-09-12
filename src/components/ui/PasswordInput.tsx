'use client';

/**
 * @file PasswordInput - Sifre input'u icin show/hide toggle.
 *
 * Mobile responsive, touch target >= 44px, aria-label ve aria-invalid destegi.
 *
 * Kullanim:
 * ```tsx
 * <PasswordInput
 *   id="password"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   required
 *   disabled={loading}
 *   aria-invalid={!!error}
 *   aria-describedby={error ? 'password-error' : undefined}
 * />
 * ```
 */

import { useState, forwardRef, useId } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label metni (sr-only veya visible) */
  label?: string;
  /** Label visible mi (default: false=sr-only) */
  showLabel?: boolean;
  /**
   * Dis kaynakli bir label zaten varsa (orn. FormField veya elle yazilmis
   * <label htmlFor>), internal label RENDER EDILMEZ. Ayni id'ye iki label
   * baglanmasini (duplicate accessible name) onler.
   */
  hideLabel?: boolean;
  /** Hata mesaji (varsa aria-invalid ve aria-describedby otomatik ayarlanir) */
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      label = 'Şifre',
      showLabel = false,
      hideLabel = false,
      error,
      disabled,
      className = '',
      id: idProp,
      'aria-describedby': ariaDescribedByProp,
      ...rest
    },
    ref
  ) {
    const autoId = useId();
    const id = idProp ?? autoId;
    const errorId = `${id}-error`;
    const [visible, setVisible] = useState(false);

    const toggle = () => setVisible((v) => !v);

    const hasError = Boolean(error);
    const describedBy = [
      ariaDescribedByProp,
      hasError ? errorId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full">
        {!hideLabel && (
          <label
            htmlFor={id}
            className={showLabel
              ? 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5'
              : 'sr-only'
            }
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            disabled={disabled}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={describedBy}
            autoComplete="current-password"
            className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 pr-12 min-h-[44px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed aria-[invalid=true]:border-rose-500 aria-[invalid=true]:ring-rose-500/20 ${className}`}
            {...rest}
          />
          <button
            type="button"
            onClick={toggle}
            disabled={disabled}
            aria-label={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex items-center justify-center min-h-[44px] min-w-[44px] px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
            tabIndex={0}
          >
            {visible ? (
              <FaEyeSlash className="w-4 h-4" aria-hidden="true" />
            ) : (
              <FaEye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-rose-600 dark:text-rose-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

export default PasswordInput;
