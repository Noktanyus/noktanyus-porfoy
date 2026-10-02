'use client';

/**
 * PayTR Direkt API kart formu.
 * Kart alanları yalnızca https://www.paytr.com/odeme adresine POST edilir —
 * kendi API'mize kart verisi gitmez (PCI gereksinimi).
 */

import { useState } from 'react';
import { DS } from '@/lib/design-system';

export interface PaytrFormPayload {
  formAction: string;
  fields: Record<string, string>;
  orderNumber?: string;
}

interface PaytrCardFormProps {
  payload: PaytrFormPayload;
  onCancel?: () => void;
}

export function PaytrCardForm({ payload, onCancel }: PaytrCardFormProps) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="glass-card-premium p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Kart ile Ödeme</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ödeme PayTR güvenli altyapısı üzerinden alınır. Kart bilgileriniz sitemizde
          saklanmaz.
        </p>
        {payload.orderNumber && (
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            Sipariş: {payload.orderNumber}
          </p>
        )}
        {(payload.fields?.test_mode === '1' || process.env.NEXT_PUBLIC_PAYTR_TEST_MODE === '1') && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-medium">
            <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>
              <strong>PayTR Test Modu:</strong> Gerçek kart çekimi yapılmaz. Test simülasyonu aktiftir.
            </span>
          </div>
        )}
      </div>

      <form
        action={payload.formAction}
        method="post"
        acceptCharset="UTF-8"
        onSubmit={() => setSubmitting(true)}
        className="space-y-4"
      >
        {Object.entries(payload.fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

        <label className="block text-sm">
          <span className="text-muted-foreground mb-1 block">Kart üzerindeki isim</span>
          <input
            name="cc_owner"
            required
            autoComplete="cc-name"
            maxLength={50}
            className={DS.input}
            placeholder="AD SOYAD"
          />
        </label>

        <label className="block text-sm">
          <span className="text-muted-foreground mb-1 block">Kart numarası</span>
          <input
            name="card_number"
            required
            inputMode="numeric"
            autoComplete="cc-number"
            pattern="[0-9 ]{15,19}"
            maxLength={19}
            className={DS.input}
            placeholder="•••• •••• •••• ••••"
          />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="block text-sm">
            <span className="text-muted-foreground mb-1 block">Ay</span>
            <input
              name="expiry_month"
              required
              inputMode="numeric"
              autoComplete="cc-exp-month"
              pattern="[0-9]{1,2}"
              maxLength={2}
              className={DS.input}
              placeholder="12"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground mb-1 block">Yıl</span>
            <input
              name="expiry_year"
              required
              inputMode="numeric"
              autoComplete="cc-exp-year"
              pattern="[0-9]{2}"
              maxLength={2}
              className={DS.input}
              placeholder="28"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground mb-1 block">CVV</span>
            <input
              name="cvv"
              required
              inputMode="numeric"
              autoComplete="cc-csc"
              pattern="[0-9]{3,4}"
              maxLength={4}
              className={DS.input}
              placeholder="•••"
            />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className={`${DS.button.primary} flex-1 px-6`}
          >
            {submitting ? 'PayTR’ye yönlendiriliyor…' : 'PayTR ile Öde'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className={`${DS.button.secondary} px-6 border border-border`}
            >
              Geri
            </button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          3D Secure doğrulaması bankanız tarafından istenebilir.
        </p>
      </form>
    </div>
  );
}

export default PaytrCardForm;
