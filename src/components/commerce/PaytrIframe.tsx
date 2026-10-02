'use client';

/**
 * PayTR iFrame ödeme formu.
 * Kart bilgileri PayTR hosted sayfasında girilir — sitemize gelmez.
 * Docs: https://dev.paytr.com/iframe-api
 */

import { useEffect } from 'react';
import Script from 'next/script';
import { DS } from '@/lib/design-system';
import { PaytrCardForm, type PaytrFormPayload } from '@/components/commerce/PaytrCardForm';

export interface PaytrIframePayload {
  iframeUrl: string;
  iframeToken?: string;
  orderNumber?: string;
  paymentType?: 'card' | 'eft';
  testMode?: boolean;
}

/** Checkout API'den gelen ortak PayTR yanıtı */
export type PaytrCheckoutClientPayload =
  | (PaytrIframePayload & { mode?: 'iframe' })
  | (PaytrFormPayload & { mode?: 'direct'; formAction: string; fields: Record<string, string> });

interface PaytrIframeProps {
  payload: PaytrIframePayload;
  onCancel?: () => void;
}

declare global {
  interface Window {
    iFrameResize?: (
      options: Record<string, unknown>,
      target: string
    ) => void;
  }
}

export function PaytrIframe({ payload, onCancel }: PaytrIframeProps) {
  const isTestMode = Boolean(
    payload.testMode || process.env.NEXT_PUBLIC_PAYTR_TEST_MODE === '1'
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && window.iFrameResize) {
      try {
        window.iFrameResize({}, '#paytriframe');
      } catch {
        // resizer henüz yüklenmemiş olabilir
      }
    }
  }, [payload.iframeUrl]);

  return (
    <div className="glass-card-premium p-4 sm:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {payload.paymentType === 'eft' ? 'Havale / EFT ile Ödeme' : 'Güvenli Ödeme'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ödeme PayTR güvenli altyapısı üzerinden alınır. Kart bilgileriniz sitemizde
          saklanmaz.
        </p>
        {payload.orderNumber && (
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            Sipariş: {payload.orderNumber}
          </p>
        )}
        {isTestMode && (
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

      <Script
        src="https://www.paytr.com/js/iframeResizer.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            window.iFrameResize?.({}, '#paytriframe');
          } catch {
            /* ignore */
          }
        }}
      />

      <iframe
        src={payload.iframeUrl}
        id="paytriframe"
        title="PayTR Ödeme"
        frameBorder={0}
        scrolling="no"
        style={{ width: '100%', minHeight: 600 }}
        className="rounded-lg bg-background"
      />

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className={`${DS.button.secondary} w-full sm:w-auto px-6 border border-border`}
        >
          Geri
        </button>
      )}
    </div>
  );
}

/**
 * API yanıtına göre iFrame veya Direkt kart formu gösterir.
 */
export function PaytrCheckoutView({
  data,
  onCancel,
}: {
  data: Record<string, unknown>;
  onCancel?: () => void;
}) {
  if (typeof data.iframeUrl === 'string' && data.iframeUrl) {
    return (
      <PaytrIframe
        payload={{
          iframeUrl: data.iframeUrl,
          iframeToken:
            typeof data.iframeToken === 'string' ? data.iframeToken : undefined,
          orderNumber:
            typeof data.orderNumber === 'string' ? data.orderNumber : undefined,
          paymentType: data.paymentType === 'eft' ? 'eft' : 'card',
          testMode: Boolean(data.testMode) || data.test_mode === '1' || data.testMode === '1',
        }}
        onCancel={onCancel}
      />
    );
  }

  if (
    typeof data.formAction === 'string' &&
    data.fields &&
    typeof data.fields === 'object'
  ) {
    return (
      <PaytrCardForm
        payload={{
          formAction: data.formAction,
          fields: data.fields as Record<string, string>,
          orderNumber:
            typeof data.orderNumber === 'string' ? data.orderNumber : undefined,
        }}
        onCancel={onCancel}
      />
    );
  }

  return (
    <p className="text-sm text-red-600" role="alert">
      PayTR ödeme formu yüklenemedi.
    </p>
  );
}

/** Checkout formlarında ortak yanıt işleyici */
export function extractPaytrClientPayload(
  data: Record<string, unknown>
): PaytrCheckoutClientPayload | null {
  if (typeof data.iframeUrl === 'string' && data.iframeUrl) {
    return {
      mode: 'iframe',
      iframeUrl: data.iframeUrl,
      iframeToken:
        typeof data.iframeToken === 'string' ? data.iframeToken : undefined,
      orderNumber:
        typeof data.orderNumber === 'string' ? data.orderNumber : undefined,
      paymentType: data.paymentType === 'eft' ? 'eft' : 'card',
    };
  }
  if (
    typeof data.formAction === 'string' &&
    data.fields &&
    typeof data.fields === 'object'
  ) {
    return {
      mode: 'direct',
      formAction: data.formAction,
      fields: data.fields as Record<string, string>,
      orderNumber:
        typeof data.orderNumber === 'string' ? data.orderNumber : undefined,
    };
  }
  return null;
}

export default PaytrIframe;
