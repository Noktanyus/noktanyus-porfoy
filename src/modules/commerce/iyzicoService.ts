/**
 * iyzico Service — iyzico checkout akışını yönetir.
 *
 * - createCheckout: iyzico checkout form initialize eder, token ve paymentPageUrl döner
 * - retrieveCheckout: callback sonrası ödeme sonucunu doğrular
 * - createRefund: paymentTransactionId ile iade (canlı)
 * - Mock mode: env yoksa sahte token üretir; retrieve yalnızca mock_iyzico_ prefix'ini kabul eder
 */

import {
  getIyzico,
  isIyzicoConfigured,
  type IyzicoCheckoutInput,
  type IyzicoCheckoutResult,
  type IyzicoRefundInput,
  type IyzicoRefundResult,
  type IyzicoRetrieveResult,
} from '@/lib/iyzico';
import { getBaseUrl } from '@/lib/seo';
import { logger } from '@/lib/logger';

export const IYZICO_MOCK_TOKEN_PREFIX = 'mock_iyzico_';

function splitName(fullName?: string): { name: string; surname: string } {
  if (!fullName || !fullName.trim()) return { name: 'Ad', surname: 'Soyad' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { name: parts[0], surname: 'Soyad' };
  return { name: parts[0], surname: parts.slice(1).join(' ') };
}

function resolveCallbackUrl(explicit?: string): string {
  if (explicit && /^https?:\/\//i.test(explicit)) return explicit;
  const path = explicit?.startsWith('/')
    ? explicit
    : '/api/checkout/iyzico-callback';
  return `${getBaseUrl()}${path}`;
}

export const iyzicoService = {
  /**
   * iyzico checkout başlatır. Mock mode'da sahte token döner;
   * kullanıcı mock callback üzerinden fulfillment'a gider.
   */
  async createCheckout(input: IyzicoCheckoutInput): Promise<IyzicoCheckoutResult> {
    const callbackUrl = resolveCallbackUrl(input.callbackUrl);

    if (!isIyzicoConfigured()) {
      logger.warn('[iyzico] Not configured, returning mock checkout');
      const token = `${IYZICO_MOCK_TOKEN_PREFIX}${Date.now()}`;
      return {
        status: 'success',
        token,
        paymentPageUrl: `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`,
      };
    }

    const iyzico = getIyzico();
    const { name, surname } = splitName(input.customerName);

    const requestBody = {
      locale: 'tr',
      conversationId: input.conversationId ?? 'conv_' + Date.now(),
      price: input.totalPrice,
      paidPrice: input.paidPrice ?? input.totalPrice,
      currency: input.currency ?? 'TRY',
      installment: '1',
      paymentChannel: 'WEB',
      paymentGroup: 'PRODUCT',
      basketId: input.basketId ?? 'basket_' + Date.now(),
      callbackUrl,
      enabledInstallments: ['1'],
      buyer: {
        id: 'buyer_' + Buffer.from(input.customerEmail).toString('base64').slice(0, 16),
        name,
        surname,
        gsmNumber: input.customerPhone ?? '+905555555555',
        email: input.customerEmail,
        identityNumber: '11111111111', // iyzico sandbox zorunlu TC; production'da gerçek değer toplanmalı
        registrationAddress:
          input.billingAddress?.address ?? 'Adres belirtilmedi',
        ip: input.customerIp ?? '127.0.0.1',
        city: input.billingAddress?.city ?? 'Istanbul',
        country: input.billingAddress?.country ?? 'Turkey',
        zipCode: input.billingAddress?.zipCode ?? '34000',
      },
      shippingAddress: input.shippingAddress ??
        input.billingAddress ?? {
          contactName: input.customerName ?? `${name} ${surname}`,
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Adres belirtilmedi',
          zipCode: '34000',
        },
      billingAddress: input.billingAddress ?? {
        contactName: input.customerName ?? `${name} ${surname}`,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Adres belirtilmedi',
        zipCode: '34000',
      },
      basketItems: input.items.map((item) => ({
        id: item.id,
        name: item.name,
        category1: item.category,
        itemType: item.itemType ?? 'VIRTUAL',
        price: item.price,
      })),
    };

    return new Promise<IyzicoCheckoutResult>((resolve, reject) => {
      iyzico.checkoutFormInitialize.create(requestBody, (err: unknown, result: unknown) => {
        if (err) {
          logger.error('[iyzico] checkoutFormInitialize error', { error: err });
          reject(new Error('iyzico ödeme başlatılamadı'));
          return;
        }
        const r = result as {
          status?: string;
          token?: string;
          paymentPageUrl?: string;
          errorCode?: string;
          errorMessage?: string;
        };
        if (r.status === 'success' && r.token && r.paymentPageUrl) {
          resolve({
            status: 'success',
            token: r.token,
            paymentPageUrl: r.paymentPageUrl,
          });
        } else {
          logger.warn('[iyzico] checkoutFormInitialize returned failure', {
            errorCode: r.errorCode,
            errorMessage: r.errorMessage,
          });
          resolve({
            status: 'failure',
            errorCode: r.errorCode,
            errorMessage: r.errorMessage,
          });
        }
      });
    });
  },

  /**
   * iyzico callback sonrası token ile ödeme sonucunu doğrular.
   * Mock token'lar yalnızca `mock_iyzico_` önekiyle kabul edilir.
   */
  async retrieveCheckout(token: string): Promise<IyzicoRetrieveResult> {
    if (!isIyzicoConfigured()) {
      if (!token.startsWith(IYZICO_MOCK_TOKEN_PREFIX)) {
        logger.warn('[iyzico] mock retrieve rejected unknown token');
        return { status: 'failure', errorCode: 'MOCK_TOKEN', errorMessage: 'Geçersiz mock token' };
      }
      logger.warn('[iyzico] Not configured, mock retrieve returns success');
      return { status: 'success', paymentStatus: 'SUCCESS', token };
    }

    const iyzico = getIyzico();

    return new Promise<IyzicoRetrieveResult>((resolve, reject) => {
      iyzico.checkoutForm.retrieve(
        {
          locale: 'tr',
          conversationId: 'verify_' + Date.now(),
          token,
        },
        (err: unknown, result: unknown) => {
          if (err) {
            logger.error('[iyzico] retrieve error', { error: err });
            reject(new Error('iyzico ödeme doğrulanamadı'));
            return;
          }
          const r = result as {
            status?: string;
            paymentStatus?: string;
            errorCode?: string;
            errorMessage?: string;
            [key: string]: unknown;
          };
          if (r.status === 'success' && r.paymentStatus === 'SUCCESS') {
            resolve(r as IyzicoRetrieveResult);
          } else {
            resolve({
              status: 'failure',
              errorCode: r.errorCode,
              errorMessage: r.errorMessage,
            });
          }
        }
      );
    });
  },

  /**
   * iyzico iade. paymentTransactionId checkout retrieve'den gelir.
   */
  async createRefund(input: IyzicoRefundInput): Promise<IyzicoRefundResult> {
    if (!isIyzicoConfigured()) {
      logger.warn('[iyzico] Not configured, mock refund');
      return { status: 'success', paymentId: `mock_refund_${Date.now()}` };
    }

    const iyzico = getIyzico();
    return new Promise<IyzicoRefundResult>((resolve, reject) => {
      iyzico.refund.create(
        {
          locale: 'tr',
          conversationId: input.conversationId ?? `refund_${Date.now()}`,
          paymentTransactionId: input.paymentTransactionId,
          price: input.price,
          currency: input.currency ?? 'TRY',
          ip: input.ip ?? '127.0.0.1',
        },
        (err: unknown, result: unknown) => {
          if (err) {
            logger.error('[iyzico] refund error', { error: err });
            reject(new Error('iyzico iade başlatılamadı'));
            return;
          }
          const r = result as {
            status?: string;
            paymentId?: string;
            errorCode?: string;
            errorMessage?: string;
          };
          if (r.status === 'success') {
            resolve({ status: 'success', paymentId: r.paymentId });
          } else {
            resolve({
              status: 'failure',
              errorCode: r.errorCode,
              errorMessage: r.errorMessage,
            });
          }
        }
      );
    });
  },
};

export type { IyzicoCheckoutInput, IyzicoCheckoutResult, IyzicoRetrieveResult };
