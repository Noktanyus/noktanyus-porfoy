/**
 * PayTR Direkt API — ödeme formu hazırlama + callback işleme.
 *
 * Kart alanları istemci formunda toplanır ve doğrudan PayTR'a POST edilir.
 */

import {
  PAYTR_PAYMENT_URL,
  buildPaytrBasket,
  centsToPaytrAmount,
  createDirectPaytrToken,
  getPaytrConfig,
  isPaytrConfigured,
  sanitizePaytrEmail,
  toPaytrMerchantOid,
  verifyPaytrCallbackHash,
} from '@/lib/paytr';
import { ValidationError } from '@/modules/shared/errors';
import { logger } from '@/lib/logger';

export interface PaytrBasketLine {
  name: string;
  priceCents: number;
  quantity: number;
}

export interface PreparePaytrDirectInput {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  userIp: string;
  totalCents: number;
  basket: PaytrBasketLine[];
  okPath?: string;
  failPath?: string;
  installmentCount?: number;
}

export interface PaytrDirectFormPayload {
  provider: 'paytr';
  formAction: typeof PAYTR_PAYMENT_URL;
  merchantOid: string;
  orderNumber: string;
  /** Kart hariç gizli alanlar — istemci forma ekler */
  fields: Record<string, string>;
}

function baseUrl(): string {
  return process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
}

export const paytrService = {
  isConfigured: isPaytrConfigured,

  prepareDirectPayment(input: PreparePaytrDirectInput): PaytrDirectFormPayload {
    if (!isPaytrConfigured()) {
      throw new ValidationError('PayTR yapılandırılmamış');
    }

    const cfg = getPaytrConfig();
    const merchantOid = toPaytrMerchantOid(input.orderNumber);
    const email = sanitizePaytrEmail(input.customerEmail);
    const paymentAmount = centsToPaytrAmount(input.totalCents);
    const paymentType = 'card';
    const installmentCount = String(input.installmentCount ?? 0);
    const currency = 'TL';
    const userBasket = buildPaytrBasket(
      input.basket.length
        ? input.basket
        : [{ name: 'Siparis', priceCents: input.totalCents, quantity: 1 }]
    );

    const paytrToken = createDirectPaytrToken({
      merchantId: cfg.merchantId,
      merchantKey: cfg.merchantKey,
      merchantSalt: cfg.merchantSalt,
      userIp: input.userIp,
      merchantOid,
      email,
      paymentAmount,
      paymentType,
      installmentCount,
      currency,
      testMode: cfg.testMode,
      non3d: cfg.non3d,
    });

    const ok = `${baseUrl()}${input.okPath ?? '/odeme/basarili?paytr=1'}`;
    const fail = `${baseUrl()}${input.failPath ?? '/odeme/basarisiz'}`;

    const fields: Record<string, string> = {
      merchant_id: cfg.merchantId,
      user_ip: input.userIp,
      merchant_oid: merchantOid,
      email,
      payment_type: paymentType,
      payment_amount: paymentAmount,
      installment_count: installmentCount,
      currency,
      test_mode: cfg.testMode,
      non_3d: cfg.non3d,
      non3d_test_failed: '0',
      merchant_ok_url: ok,
      merchant_fail_url: fail,
      user_name: (input.customerName || 'Musteri').slice(0, 60),
      user_address: (input.customerAddress || 'Turkiye').slice(0, 400),
      user_phone: (input.customerPhone || '05000000000').slice(0, 20),
      user_basket: userBasket,
      debug_on: cfg.debugOn,
      client_lang: 'tr',
      paytr_token: paytrToken,
    };

    logger.info('[PayTR] Direkt form hazırlandı', {
      merchantOid,
      paymentAmount,
      testMode: cfg.testMode,
    });

    return {
      provider: 'paytr',
      formAction: PAYTR_PAYMENT_URL,
      merchantOid,
      orderNumber: input.orderNumber,
      fields,
    };
  },

  verifyCallback(body: Record<string, string>): {
    ok: boolean;
    merchantOid: string;
    status: 'success' | 'failed';
    totalAmount: string;
    failedReasonCode?: string;
    failedReasonMsg?: string;
  } {
    const cfg = getPaytrConfig();
    const merchantOid = String(body.merchant_oid ?? '');
    const status = String(body.status ?? '') as 'success' | 'failed';
    const totalAmount = String(body.total_amount ?? '0');
    const hash = String(body.hash ?? '');

    const valid = verifyPaytrCallbackHash({
      merchantKey: cfg.merchantKey,
      merchantSalt: cfg.merchantSalt,
      merchantOid,
      status,
      totalAmount,
      hash,
    });

    if (!valid) {
      logger.error('[PayTR] Callback hash geçersiz', { merchantOid });
      return { ok: false, merchantOid, status: 'failed', totalAmount };
    }

    return {
      ok: true,
      merchantOid,
      status: status === 'success' ? 'success' : 'failed',
      totalAmount,
      failedReasonCode: body.failed_reason_code,
      failedReasonMsg: body.failed_reason_msg,
    };
  },
};
