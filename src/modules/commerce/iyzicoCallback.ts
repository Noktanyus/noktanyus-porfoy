/**
 * iyzico Callback Çözümleyici
 *
 * iyzico ödeme sonrası kullanıcıyı `/odeme/iyzico-callback?token=...` adresine
 * yönlendirir. Bu modül token'ı doğrular, order'ı bulur, siparişi tamamlar ve
 * kullanıcının yönlendirileceği URL'i döner.
 *
 * NEDEN AYRI DOSYA
 * ----------------
 * Mantık page.tsx içindeydi ve `redirect()` çağrıları `try` bloğunun İÇİNDEydi.
 * Next.js'te `redirect()` bir `NEXT_REDIRECT` hatası FIRLATIR (dönüş tipi
 * `never`). Yani başarılı ödemede atılan `redirect('...?iyzico=success')`
 * hemen alttaki `catch (err)` tarafından yakalanıyor ve kullanıcı
 * `?iyzico_error=verify_failed` adresine gönderiliyordu — ödeme başarılı
 * olmasına rağmen. Sipariş DB'de PAID oluyor, kullanıcı hata görüyordu.
 *
 * Çözüm: karar verme (bu dosya) ile yönlendirme (page.tsx) ayrıldı. Böylece
 * hem hata hem başarı akışı Next.js internals'ı olmadan test edilebilir.
 */

import { orderRepository } from './repository';
import { iyzicoService } from './iyzicoService';
import { commerceService } from './service';
import { logger } from '@/lib/logger';

const SUCCESS_BASE = '/odeme/basarili';

export type IyzicoCallbackReason =
  | 'no_token'
  | 'success'
  | 'success_no_order'
  | 'failed'
  | 'verify_failed';

export interface IyzicoCallbackResolution {
  /** page.tsx'in `redirect()` edeceği hedef. */
  redirectTo: string;
  reason: IyzicoCallbackReason;
  orderNumber?: string;
}

/**
 * Callback sonucunu çözer. ASLA throw ETMEZ — her yol bir redirect hedefiyle
 * sonuçlanır. Mevcut URL şekilleri (query parametreleri dahil) korunmuştur.
 */
export async function resolveIyzicoCallback(
  token: string | undefined | null
): Promise<IyzicoCallbackResolution> {
  if (!token) {
    return { redirectTo: `${SUCCESS_BASE}?iyzico_error=no_token`, reason: 'no_token' };
  }

  try {
    const result = await iyzicoService.retrieveCheckout(token);

    if (result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
      logger.warn('[iyzico] Ödeme başarısız döndü', {
        status: result.status,
        errorCode: 'errorCode' in result ? result.errorCode : undefined,
      });
      return { redirectTo: `${SUCCESS_BASE}?iyzico_error=failed`, reason: 'failed' };
    }

    // Token bazlı order eşleşmesi — repository metodu üzerinden (unique kolon,
    // findUnique). Route içinde ham prisma sorgusu YOK.
    const order = await orderRepository.findByProviderToken(token);

    if (!order) {
      // Ödeme başarılı ama eşleşen sipariş yok: kullanıcıyı hataya düşürmüyoruz
      // (parası çekildi), ancak operasyon için error seviyesinde loglanır.
      logger.error('[iyzico] Ödeme başarılı ama token ile eşleşen sipariş yok', { token });
      return { redirectTo: `${SUCCESS_BASE}?iyzico=success`, reason: 'success_no_order' };
    }

    // handleCheckoutCompleted Stripe session imzası bekliyor; token her iki
    // alan için de kullanılır (iyzico'da ayrı bir payment_intent kavramı yok).
    // Idempotent: order zaten PAID ise hiçbir şey yapmaz.
    await commerceService.handleCheckoutCompleted({ id: token, payment_intent: token });

    logger.info('[iyzico] Order completed', {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    return {
      redirectTo: `${SUCCESS_BASE}?iyzico=success&order=${order.orderNumber}`,
      reason: 'success',
      orderNumber: order.orderNumber,
    };
  } catch (err) {
    logger.error('[iyzico] callback verification failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      redirectTo: `${SUCCESS_BASE}?iyzico_error=verify_failed`,
      reason: 'verify_failed',
    };
  }
}
