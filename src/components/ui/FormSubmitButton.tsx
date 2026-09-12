'use client';

/**
 * @file FormSubmitButton - Form submit sirasinda disabled + spinner gosteren button.
 *
 * Mobile responsive, touch target >= 44px, aria-busy destegi.
 *
 * Kullanim:
 * ```tsx
 * <FormSubmitButton loading={isSubmitting} loadingText="Kaydediliyor...">
 *   Kaydet
 * </FormSubmitButton>
 * ```
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ButtonSpinner } from './LoadingSkeleton';

interface FormSubmitButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Submit durumunda loading text (orn: "Kaydediliyor...") */
  loading?: boolean;
  /** Submit durumunda gosterilecek metin (default: children) */
  loadingText?: string;
  /** Button tipi (default: submit) */
  type?: 'submit' | 'button' | 'reset';
  /** Variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Full width */
  fullWidth?: boolean;
  /** Ikon (loading sirasinda degil, normal durumda) */
  icon?: ReactNode;
  children: ReactNode;
}

const VARIANT_CLASSES = {
  primary:
    'bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/20 focus-visible:ring-brand-primary',
  secondary:
    'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:ring-slate-500',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/20 focus-visible:ring-rose-500',
};

export function FormSubmitButton({
  loading = false,
  loadingText,
  type = 'submit',
  variant = 'primary',
  fullWidth = false,
  icon,
  disabled,
  className = '',
  children,
  ...rest
}: FormSubmitButtonProps) {
  const isDisabled = Boolean(loading || disabled);
  const variantClass = VARIANT_CLASSES[variant];

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${variantClass} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <ButtonSpinner size="small" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        <>
          {icon && <span aria-hidden="true">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}

export default FormSubmitButton;
