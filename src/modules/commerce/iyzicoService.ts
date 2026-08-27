/**
 * iyzico Service — iyzico checkout akışını yönetir.
 *
 * - createCheckout: iyzico checkout form initialize eder, token ve paymentPageUrl döner
 * - retrieveCheckout: callback sonrası ödeme sonucunu doğrular
 * - Mock mode: env değişkenleri yoksa hata fırlatmaz, geliştirme için sahte token üretir
 */

import {
  getIyzico,
  isIyzicoConfigured,
  type IyzicoCheckoutInput,
  type IyzicoCheckoutResult,
  type IyzicoRetrieveResult,
} from '@/lib/iyzico';
import { logger } from '@/lib/logger';

function splitName(fullName?: string): { name: string; surname: string } {
  if (!fullName || !fullName.trim()) return { name: 'Ad', surname: 'Soyad' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { name: parts[0], surname: 'Soyad' };
  return { name: parts[0], surname: parts.slice(1).join(' ') };
}

function buildCallbackUrl(baseUrl: string, path = '/odeme/iyzico-callback'): string {
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

export const iyzicoService = {
  /**
   * iyzico checkout başlatır. Mock mode'da sahte token döner.
   */
  async createCheckout(input: IyzicoCheckoutInput): Promise<IyzicoCheckoutResult> {
    if (!isIyzicoConfigured()) {
      logger.warn('[iyzico] Not configured, returning mock checkout');
      return {
        status: 'success',
        token: 'mock_iyzico_' + Date.now(),
        paymentPageUrl: `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/odeme/basarili?mock_iyzico=1&token=mock_${Date.now()}`,
      };
    }

    const iyzico = getIyzico();
    const { name, surname } = splitName(input.customerName);

    const callbackUrl = buildCallbackUrl(
      process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    );

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
        identityNumber: '11111111111', // Sandbox/test için
        registrationAddress:
          input.billingAddress?.address ?? 'Adres belirtilmedi',
        ip: input.customerIp ?? '127.0.0.1',
        city: input.billingAddress?.city ?? 'Istanbul',
        country: input.billingAddress?.country ?? 'Turkey',
        zipCode: input.billingAddress?.zipCode ?? '34000',
      },
      shippingAddress: input.shippingAddress ?? input.billingAddress,
      billingAddress: input.billingAddress,
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
   */
  async retrieveCheckout(token: string): Promise<IyzicoRetrieveResult> {
    if (!isIyzicoConfigured()) {
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
};

export type { IyzicoCheckoutInput, IyzicoCheckoutResult, IyzicoRetrieveResult };