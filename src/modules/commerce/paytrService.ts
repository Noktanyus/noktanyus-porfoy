/**
 * PayTR servis — iFrame API (birincil), Direkt API (fallback),
 * callback doğrulama, iade, durum sorgu, işlem dökümü.
 */

import {
  PAYTR_GET_TOKEN_URL,
  PAYTR_PAYMENT_URL,
  PAYTR_REFUND_URL,
  PAYTR_REPORT_URL,
  PAYTR_STATUS_URL,
  buildPaytrBasket,
  buildPaytrIframeBasket,
  centsToPaytrAmount,
  centsToPaytrIframeAmount,
  createDirectPaytrToken,
  createEftIframePaytrToken,
  createIframePaytrToken,
  createRefundPaytrToken,
  createReportPaytrToken,
  createStatusPaytrToken,
  getPaytrConfig,
  iframeUrlForToken,
  isPaytrConfigured,
  sanitizePaytrEmail,
  toPaytrMerchantOid,
  verifyPaytrCallbackHash,
  type PaytrPaymentType,
} from '@/lib/paytr';
import { ValidationError } from '@/modules/shared/errors';
import { logger } from '@/lib/logger';

export interface PaytrBasketLine {
  name: string;
  priceCents: number;
  quantity: number;
}

export interface PreparePaytrPaymentInput {
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
  /** card (varsayılan) | eft (PayTR mağaza yetkisi gerekir) */
  paymentType?: PaytrPaymentType;
}

export interface PaytrIframePayload {
  provider: 'paytr';
  mode: 'iframe';
  formAction?: undefined;
  fields?: undefined;
  iframeToken: string;
  iframeUrl: string;
  merchantOid: string;
  orderNumber: string;
  paymentType: PaytrPaymentType;
  testMode?: boolean;
}

export interface PaytrDirectFormPayload {
  provider: 'paytr';
  mode: 'direct';
  formAction: typeof PAYTR_PAYMENT_URL;
  merchantOid: string;
  orderNumber: string;
  fields: Record<string, string>;
  iframeToken?: undefined;
  iframeUrl?: undefined;
  paymentType: 'card';
}

export type PaytrCheckoutPayload = PaytrIframePayload | PaytrDirectFormPayload;

function baseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    'http://localhost:3000'
  );
}

async function postForm(
  url: string,
  fields: Record<string, string>
): Promise<Record<string, unknown>> {
  const body = new URLSearchParams(fields);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new ValidationError(`PayTR yanıtı geçersiz: ${text.slice(0, 200)}`);
  }
}

export const paytrService = {
  isConfigured: isPaytrConfigured,

  /**
   * Varsayılan: iFrame API. PAYTR_CHECKOUT_MODE=direct ise Direkt API.
   */
  async preparePayment(
    input: PreparePaytrPaymentInput
  ): Promise<PaytrCheckoutPayload> {
    if (!isPaytrConfigured()) {
      throw new ValidationError('PayTR yapılandırılmamış');
    }

    const cfg = getPaytrConfig();
    const paymentType: PaytrPaymentType =
      input.paymentType === 'eft' && cfg.eftEnabled ? 'eft' : 'card';

    if (cfg.checkoutMode === 'direct' && paymentType === 'card') {
      return this.prepareDirectPayment(input);
    }

    return this.prepareIframePayment({ ...input, paymentType });
  },

  async prepareIframePayment(
    input: PreparePaytrPaymentInput & { paymentType?: PaytrPaymentType }
  ): Promise<PaytrIframePayload> {
    if (!isPaytrConfigured()) {
      throw new ValidationError('PayTR yapılandırılmamış');
    }

    const cfg = getPaytrConfig();
    const paymentType: PaytrPaymentType =
      input.paymentType === 'eft' && cfg.eftEnabled ? 'eft' : 'card';
    const merchantOid = toPaytrMerchantOid(input.orderNumber);
    const email = sanitizePaytrEmail(input.customerEmail);
    const paymentAmount = centsToPaytrIframeAmount(input.totalCents);
    const currency = 'TL';
    const ok = `${baseUrl()}${input.okPath ?? '/odeme/basarili?paytr=1'}`;
    const fail = `${baseUrl()}${input.failPath ?? '/odeme/basarisiz'}`;

    let paytrToken: string;
    const postVals: Record<string, string> = {
      merchant_id: cfg.merchantId,
      user_ip: input.userIp,
      merchant_oid: merchantOid,
      email,
      payment_amount: paymentAmount,
      debug_on: cfg.debugOn,
      test_mode: cfg.testMode,
      timeout_limit: cfg.timeoutLimit,
      user_name: (input.customerName || 'Musteri').slice(0, 60),
      user_phone: (input.customerPhone || '05000000000').slice(0, 20),
    };

    if (paymentType === 'eft') {
      paytrToken = createEftIframePaytrToken({
        merchantId: cfg.merchantId,
        merchantKey: cfg.merchantKey,
        merchantSalt: cfg.merchantSalt,
        userIp: input.userIp,
        merchantOid,
        email,
        paymentAmount,
        paymentType: 'eft',
        testMode: cfg.testMode,
      });
      postVals.payment_type = 'eft';
      postVals.paytr_token = paytrToken;
    } else {
      const userBasket = buildPaytrIframeBasket(
        input.basket.length
          ? input.basket
          : [{ name: 'Siparis', priceCents: input.totalCents, quantity: 1 }]
      );
      paytrToken = createIframePaytrToken({
        merchantId: cfg.merchantId,
        merchantKey: cfg.merchantKey,
        merchantSalt: cfg.merchantSalt,
        userIp: input.userIp,
        merchantOid,
        email,
        paymentAmount,
        userBasket,
        noInstallment: cfg.noInstallment,
        maxInstallment: cfg.maxInstallment,
        currency,
        testMode: cfg.testMode,
      });
      Object.assign(postVals, {
        paytr_token: paytrToken,
        user_basket: userBasket,
        no_installment: cfg.noInstallment,
        max_installment: cfg.maxInstallment,
        user_address: (input.customerAddress || 'Turkiye').slice(0, 400),
        merchant_ok_url: ok,
        merchant_fail_url: fail,
        currency,
        lang: 'tr',
      });
    }

    const result = await postForm(PAYTR_GET_TOKEN_URL, postVals);
    if (result.status !== 'success' || typeof result.token !== 'string') {
      const reason =
        typeof result.reason === 'string' ? result.reason : 'token alınamadı';
      logger.error('[PayTR] get-token failed', { reason, merchantOid });
      throw new ValidationError(`PayTR ödeme başlatılamadı: ${reason}`);
    }

    const iframeToken = result.token;
    const iframeUrl = iframeUrlForToken(iframeToken, paymentType);

    logger.info('[PayTR] iFrame token alındı', {
      merchantOid,
      paymentAmount,
      paymentType,
      testMode: cfg.testMode,
    });

    return {
      provider: 'paytr',
      mode: 'iframe',
      iframeToken,
      iframeUrl,
      merchantOid,
      orderNumber: input.orderNumber,
      paymentType,
      testMode: cfg.testMode === '1',
    };
  },

  /** Legacy Direkt API — kart alanları istemci formunda, PayTR'a POST. */
  prepareDirectPayment(input: PreparePaytrPaymentInput): PaytrDirectFormPayload {
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
      mode: 'direct',
      formAction: PAYTR_PAYMENT_URL,
      merchantOid,
      orderNumber: input.orderNumber,
      fields,
      paymentType: 'card',
    };
  },

  verifyCallback(body: Record<string, string>): {
    ok: boolean;
    merchantOid: string;
    status: 'success' | 'failed';
    totalAmount: string;
    paymentType?: string;
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
      paymentType: body.payment_type,
      failedReasonCode: body.failed_reason_code,
      failedReasonMsg: body.failed_reason_msg,
    };
  },

  /** https://dev.paytr.com/iade-api */
  async refund(input: {
    merchantOid: string;
    returnAmountCents: number;
    referenceNo?: string;
  }): Promise<{
    status: string;
    merchantOid: string;
    returnAmount: string;
    isTest?: string | number;
    referenceNo?: string;
    errNo?: string;
    errMsg?: string;
  }> {
    const cfg = getPaytrConfig();
    const returnAmount = centsToPaytrAmount(input.returnAmountCents);
    const paytrToken = createRefundPaytrToken({
      merchantId: cfg.merchantId,
      merchantKey: cfg.merchantKey,
      merchantSalt: cfg.merchantSalt,
      merchantOid: input.merchantOid,
      returnAmount,
    });

    const fields: Record<string, string> = {
      merchant_id: cfg.merchantId,
      merchant_oid: input.merchantOid,
      return_amount: returnAmount,
      paytr_token: paytrToken,
    };
    if (input.referenceNo) {
      fields.reference_no = input.referenceNo.slice(0, 64);
    }

    const result = await postForm(PAYTR_REFUND_URL, fields);
    return {
      status: String(result.status ?? 'error'),
      merchantOid: String(result.merchant_oid ?? input.merchantOid),
      returnAmount: String(result.return_amount ?? returnAmount),
      isTest: result.is_test as string | number | undefined,
      referenceNo: result.reference_no as string | undefined,
      errNo: result.err_no as string | undefined,
      errMsg: result.err_msg as string | undefined,
    };
  },

  /** https://dev.paytr.com/durum-sorgu */
  async queryStatus(merchantOid: string): Promise<Record<string, unknown>> {
    const cfg = getPaytrConfig();
    const paytrToken = createStatusPaytrToken({
      merchantId: cfg.merchantId,
      merchantKey: cfg.merchantKey,
      merchantSalt: cfg.merchantSalt,
      merchantOid,
    });
    return postForm(PAYTR_STATUS_URL, {
      merchant_id: cfg.merchantId,
      merchant_oid: merchantOid,
      paytr_token: paytrToken,
    });
  },

  /**
   * https://dev.paytr.com/islem-dokumu
   * Tarih aralığı en fazla 3 gün.
   */
  async fetchTransactionReport(input: {
    startDate: string;
    endDate: string;
    dummy?: boolean;
  }): Promise<Record<string, unknown>> {
    const cfg = getPaytrConfig();
    const paytrToken = createReportPaytrToken({
      merchantId: cfg.merchantId,
      merchantKey: cfg.merchantKey,
      merchantSalt: cfg.merchantSalt,
      startDate: input.startDate,
      endDate: input.endDate,
    });
    const fields: Record<string, string> = {
      merchant_id: cfg.merchantId,
      start_date: input.startDate,
      end_date: input.endDate,
      paytr_token: paytrToken,
    };
    if (input.dummy) fields.dummy = '1';
    return postForm(PAYTR_REPORT_URL, fields);
  },
};
