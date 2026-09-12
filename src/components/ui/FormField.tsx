'use client';

/**
 * @file FormField - Tek tutarli form alani wrapper.
 *
 * Label, input, helper text ve error mesajini tek component'te birlestirir.
 * Auto-id ile aria-describedby / aria-invalid otomatik ayarlanir.
 * Touch target min-h-[44px] mobile responsive.
 *
 * Kullanim:
 * ```tsx
 * <FormField id="email" label="E-posta" type="email" required error={errors.email?.message}>
 *   <input id="email" type="email" ... />
 * </FormField>
 * ```
 */

import { useId, type ReactNode } from 'react';
import { DS } from '@/lib/design-system';

interface FormFieldProps {
  /** Form alani unique id (auto uretilir) */
  id?: string;
  /** Label metni */
  label: string;
  /** Helper text (input altinda aciklama) */
  helperText?: string;
  /** Hata mesaji (varsa aria-invalid=true, role=alert ile gosterilir) */
  error?: string;
  /** Required gosterimi (label yaninda yildiz) */
  required?: boolean;
  /** Children (input/textarea/select vs) */
  children: (props: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean;
  }) => ReactNode;
  /** Wrapper className */
  className?: string;
}

export function FormField({
  id: idProp,
  label,
  helperText,
  error,
  required = false,
  children,
  className = '',
}: FormFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const hasError = Boolean(error);

  const describedBy = [
    hasError ? errorId : null,
    helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={DS.label}>
        {label}
        {required && (
          <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
        )}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': hasError,
      })}
      {helperText && !hasError && (
        <p id={helperId} className={DS.helperText}>
          {helperText}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className={DS.errorText}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
