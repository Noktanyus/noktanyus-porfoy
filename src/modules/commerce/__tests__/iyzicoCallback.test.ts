/**
 * iyzico Callback Tests (item 3)
 *
 * İki ayrı konu:
 *
 * A) `resolveIyzicoCallback` — hata VE başarı akışları.
 *    Regresyon odağı: `redirect()` çağrıları eskiden try bloğunun içindeydi.
 *    Next.js'te `redirect()` NEXT_REDIRECT hatası fırlattığı için BAŞARILI
 *    ödeme de catch'e düşüyor ve kullanıcı `?iyzico_error=verify_failed`
 *    görüyordu. Aşağıdaki testler her yolun doğru URL'e gittiğini sabitler.
 *
 * B) Gerçek iyzico recurring (subscription) entegrasyonunun EKSİK olduğunu
 *    belgeleyen testler. Bu bir "feature flag" ya da TODO ile gizlenmiyor;
 *    mevcut davranış (tek çekim) test ile tespit ediliyor. Böylece biri gerçek
 *    /subscription/api entegrasyonunu eklediğinde bu testler kırılır ve
 *    beklentinin değiştiği görünür olur.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../iyzicoService', () => ({
  iyzicoService: {
    retrieveCheckout: vi.fn(),
    createCheckout: vi.fn(),
  },
}));

vi.mock('../repository', () => ({
  orderRepository: {
    findByProviderToken: vi.fn(),
  },
}));

vi.mock('../service', () => ({
  commerceService: {
    handleCheckoutCompleted: vi.fn(),
  },
}));

import { resolveIyzicoCallback } from '../iyzicoCallback';
import { iyzicoService } from '../iyzicoService';
import { orderRepository } from '../repository';
import { commerceService } from '../service';
import { logger } from '@/lib/logger';

const paidOrder = {
  id: 'order_1',
  orderNumber: 'NK-2601-ABC123',
  status: 'PENDING',
  customerEmail: 'buyer@example.com',
  items: [],
  licenses: [],
  customer: null,
};

describe('resolveIyzicoCallback — başarı akışı', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ödeme başarılı + order bulundu → iyzico=success&order=... (REGRESYON: eskiden verify_failed dönüyordu)', async () => {
    vi.mocked(iyzicoService.retrieveCheckout).mockResolvedValue({
      status: 'success',
      paymentStatus: 'SUCCESS',
      token: 'tok_1',
    } as any);
    vi.mocked(orderRepository.findByProviderToken).mockResolvedValue(paidOrder as any);
    vi.mocked(commerceService.handleCheckoutCompleted).mockResolvedValue(undefined as any);

    const result = await resolveIyzicoCallback('tok_1');

    expect(result.reason).toBe('success');
    expect(result.redirectTo).toBe('/odeme/basarili?iyzico=success&order=NK-2601-ABC123');
    expect(result.orderNumber).toBe('NK-2601-ABC123');
    // Kesinlikle hata yoluna düşmedi
    expect(result.redirectTo).not.toContain('verify_failed');
  });

  it('order eşleşmesi TOKEN bazlı repository metoduyla yapılır (route.ta ham prisma yok)', async () => {
    vi.mocked(iyzicoService.retrieveCheckout).mockResolvedValue({
      status: 'success',
      paymentStatus: 'SUCCESS',
      token: 'tok_xyz',
    } as any);
    vi.mocked(orderRepository.findByProviderToken).mockResolvedValue(paidOrder as any);

    await resolveIyzicoCallback('tok_xyz');

    expect(orderRepository.findByProviderToken).toHaveBeenCalledWith('tok_xyz');
    expect(orderRepository.findByProviderToken).toHaveBeenCalledTimes(1);
  });

  it('siparişi tamamlamak için handleCheckoutCompleted token ile çağrılır', async () => {
    vi.mocked(iyzicoService.retrieveCheckout).mockResolvedValue({
      status: 'success',
      paymentStatus: 'SUCCESS',
      token: 'tok_1',
    } as any);
    vi.mocked(orderRepository.findByProviderToken).mockResolvedValue(paidOrder as any);

    await resolveIyzicoCallback('tok_1');

    expect(commerceService.handleCheckoutCompleted).toHaveBeenCalledWith({
      id: 'tok_1',
      payment_intent: 'tok_1',
    });
  });

  it('ödeme başarılı ama order yok → iyzico=success (kullanıcı hataya düşmez) + error logu', async () => {
    vi.mocked(iyzicoService.retrieveCheckout).mockResolvedValue({
      status: 'success',
      paymentStatus: 'SUCCESS',
      token: 'tok_1',
    } as any);
    vi.mocked(orderRepository.findByProviderToken).mockResolvedValue(null);

    const result = await resolveIyzicoCallback('tok_1');

    expect(result.reason).toBe('success_no_order');
    expect(result.redirectTo).toBe('/odeme/basarili?iyzico=success');
    expect(commerceService.handleCheckoutCompleted).not.toHaveBeenCalled();
    // Para çekilmiş ama sipariş yok — operasyonun görmesi gerekir
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('eşleşen sipariş yok'),
      expect.objectContaining({ token: 'tok_1' })
    );
  });

  it('aynı token ile iki kez çağrılmak güvenlidir (kullanıcı sayfayı yenilerse)', async () => {
    vi.mocked(iyzicoService.retrieveCheckout).mockResolvedValue({
      status: 'success',
      paymentStatus: 'SUCCESS',
      token: 'tok_1',
    } as any);
    vi.mocked(orderRepository.findByProviderToken).mockResolvedValue(paidOrder as any);

    const first = await resolveIyzicoCallback('tok_1');
    const second = await resolveIyzicoCallback('tok_1');

    expect(first).toEqual(second);
  });
});

describe('resolveIyzicoCallback — hata akışı', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('token yoksa → iyzico_error=no_token ve iyzico HİÇ çağrılmaz', async () => {
    const result = await resolveIyzicoCallback(undefined);

    expect(result.reason).toBe('no_token');
    expect(result.redirectTo).toBe('/odeme/basarili?iyzico_error=no_token');
    expect(iyzicoService.retrieveCheckout).not.toHaveBeenCalled();
  });

  it('boş string token da no_token sayılır', async () => {
    const result = await resolveIyzicoCallback('');
    expect(result.reason).toBe('no_token');
  });

  it('iyzico failure döndürürse → iyzico_error=failed', async () => {
    vi.mocked(iyzicoService.retrieveCheckout).mockResolvedValue({
      status: 'failure',
      errorCode: '5001',
      errorMessage: 'Kart limiti yetersiz',
    } as any);

    const result = await resolveIyzicoCallback('tok_1');

    expect(result.reason).toBe('failed');
    expect(result.redirectTo).toBe('/odeme/basarili?iyzico_error=failed');
    // Ödeme başarısız → sipariş PAID yapılmadı
    expect(commerceService.handleCheckoutCompleted).not.toHaveBeenCalled();
    expect(orderRepository.findByProviderToken).not.toHaveBeenCalled();
  });

  it('paymentStatus FAILURE ise (status success olsa bile) → failed', async () => {
    vi.mocked(iyzicoService.retrieveCheckout).mockResolvedValue({
      status: 'success',
      paymentStatus: 'FAILURE',
      token: 'tok_1',
    } as any);

    const result = await resolveIyzicoCallback('tok_1');

    expect(result.reason).toBe('failed');
    expect(commerceService.handleCheckoutCompleted).not.toHaveBeenCalled();
  });

  it('retrieveCheckout throw ederse → iyzico_error=verify_failed', async () => {
    vi.mocked(iyzicoService.retrieveCheckout).mockRejectedValue(
      new Error('iyzico ödeme doğrulanamadı')
    );

    const result = await resolveIyzicoCallback('tok_1');

    expect(result.reason).toBe('verify_failed');
    expect(result.redirectTo).toBe('/odeme/basarili?iyzico_error=verify_failed');
  });

  it('handleCheckoutCompleted throw ederse → verify_failed (hata dışarı sızmaz)', async () => {
    vi.mocked(iyzicoService.retrieveCheckout).mockResolvedValue({
      status: 'success',
      paymentStatus: 'SUCCESS',
      token: 'tok_1',
    } as any);
    vi.mocked(orderRepository.findByProviderToken).mockResolvedValue(paidOrder as any);
    vi.mocked(commerceService.handleCheckoutCompleted).mockRejectedValue(
      new Error('DB down')
    );

    const result = await resolveIyzicoCallback('tok_1');

    expect(result.reason).toBe('verify_failed');
  });

  it('hiçbir yolda throw ETMEZ — her senaryo bir redirect hedefi döner', async () => {
    const scenarios: Array<() => void> = [
      () => vi.mocked(iyzicoService.retrieveCheckout).mockRejectedValue(new Error('x')),
      () =>
        vi.mocked(iyzicoService.retrieveCheckout).mockResolvedValue({
          status: 'failure',
        } as any),
      () =>
        vi.mocked(iyzicoService.retrieveCheckout).mockResolvedValue({
          status: 'success',
          paymentStatus: 'SUCCESS',
        } as any),
    ];

    for (const setup of scenarios) {
      vi.clearAllMocks();
      setup();
      vi.mocked(orderRepository.findByProviderToken).mockResolvedValue(null);
      const result = await resolveIyzicoCallback('tok_1');
      expect(result.redirectTo).toMatch(/^\/odeme\/basarili\?/);
    }
  });
});

/**
 * GERÇEK RECURRING ENTEGRASYONUNUN EKSİKLİĞİNİ BELGELEYEN TESTLER
 *
 * iyzico'nun /v2/subscription/* endpoint'leri (pricing plan, subscription
 * initialize, subscription cancel, kart saklama ile otomatik yenileme) BU
 * KOD TABANINDA KULLANILMIYOR. `iyzicoSubscriptionService` aboneliği
 * `checkoutFormInitialize` (TEK ÇEKİM) üzerinden modelliyor.
 *
 * Pratik sonuçları:
 *   - Abonelik OTOMATİK YENİLENMEZ; periyot sonunda ikinci bir çekim yapılmaz.
 *   - iyzico tarafında bir subscriptionReferenceCode yok, dolayısıyla
 *     Subscription.stripeSubscriptionId iyzico için doldurulamıyor.
 *   - iyzico'dan gelen abonelik durum değişikliği webhook'u yok; bu yüzden
 *     subscriptionSync yalnızca Stripe tarafını besliyor.
 *
 * Aşağıdaki testler bu gerçekleri sabitler. Gerçek recurring eklenirse
 * kırılacaklar — bu istenen davranış (sessiz bir varsayım kalmasın).
 */
describe('iyzico recurring entegrasyonu — BİLİNEN EKSİKLİK (dokümantasyon testi)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('iyzico client yüzeyinde subscription/recurring metodu YOK', async () => {
    const iyzicoLib = await import('@/lib/iyzico');

    // lib/iyzico.ts'in tanımladığı IyzicoClient yalnızca tek çekim yüzeyini
    // (checkoutFormInitialize + checkoutForm.retrieve) kapsıyor.
    const exported = Object.keys(iyzicoLib);
    expect(exported).toContain('getIyzico');
    expect(exported.some((k) => /subscription|recurring|pricingPlan/i.test(k))).toBe(
      false
    );
  });

  it('iyzicoSubscriptionService abonelik için TEK ÇEKİM checkout kullanır (recurring API değil)', async () => {
    const iyzicoLib = await import('@/lib/iyzico');
    vi.spyOn(iyzicoLib, 'isIyzicoConfigured').mockReturnValue(true);

    const create = vi.fn((_body: unknown, cb: (e: unknown, r: unknown) => void) => {
      cb(null, {
        status: 'success',
        token: 'iyz_tok_1',
        paymentPageUrl: 'https://sandbox.iyzipay.com/checkout',
      });
    });
    vi.spyOn(iyzicoLib, 'getIyzico').mockReturnValue({
      checkoutFormInitialize: { create },
      checkoutForm: { retrieve: vi.fn() },
    } as any);

    vi.doMock('@/lib/prisma', () => ({
      prisma: {
        plan: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'plan_1',
            slug: 'pro',
            name: 'Pro',
            priceCents: 29900,
            currency: 'try',
          }),
        },
      },
    }));

    const { iyzicoSubscriptionService } = await import('../iyzicoSubscriptionService');
    const result = await iyzicoSubscriptionService.createSubscriptionCheckout({
      planSlug: 'pro',
      customerEmail: 'a@b.com.tr',
      callbackUrl: '/odeme/iyzico-callback',
    });

    expect(result.provider).toBe('iyzico');
    expect(result.token).toBe('iyz_tok_1');

    // Çağrılan SDK metodu tek çekim formu — recurring/subscription değil.
    expect(create).toHaveBeenCalledTimes(1);
    const body = create.mock.calls[0]![0] as Record<string, unknown>;

    // paymentGroup 'SUBSCRIPTION' sadece bir ETİKET; iyzico bunu otomatik
    // yenileme olarak işlemez. Gerçek recurring'de pricingPlanReferenceCode
    // gönderilir — burada YOK.
    expect(body.paymentGroup).toBe('SUBSCRIPTION');
    expect(body).not.toHaveProperty('pricingPlanReferenceCode');
    expect(body).not.toHaveProperty('subscriptionInitialize');
    expect(body).not.toHaveProperty('recurringPaymentRequest');

    // Kart saklama (otomatik yenileme için şart) talep edilmiyor.
    expect(body).not.toHaveProperty('cardUserKey');
    expect(body.installment).toBe('1');
  });

  it('iyzico abonelik sonucu subscriptionReferenceCode DÖNDÜRMEZ', async () => {
    const iyzicoLib = await import('@/lib/iyzico');
    vi.spyOn(iyzicoLib, 'isIyzicoConfigured').mockReturnValue(false);

    vi.doMock('@/lib/prisma', () => ({
      prisma: {
        plan: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'plan_1',
            slug: 'pro',
            name: 'Pro',
            priceCents: 29900,
            currency: 'try',
          }),
        },
      },
    }));

    const { iyzicoSubscriptionService } = await import('../iyzicoSubscriptionService');
    const result = await iyzicoSubscriptionService.createSubscriptionCheckout({
      planSlug: 'pro',
      customerEmail: 'a@b.com.tr',
      callbackUrl: '/odeme/iyzico-callback',
    });

    // Dönüş şekli yalnızca tek çekim token'ı içerir.
    expect(Object.keys(result).sort()).toEqual(
      ['mock', 'planSlug', 'provider', 'token', 'url'].sort()
    );
    expect(result).not.toHaveProperty('subscriptionReferenceCode');
  });

  it('subscriptionSync yalnızca Stripe girdisi kabul eder — iyzico abonelik senkronu yok', async () => {
    const sync = await import('../subscriptionSync');

    // Sözleşme adları bilinçli olarak Stripe'a özgü: iyzico aboneliğini
    // buradan senkronlamanın bir yolu YOK (iyzico'da abonelik nesnesi yok).
    expect(typeof sync.subscriptionSyncService.syncFromStripe).toBe('function');
    expect(typeof sync.subscriptionSyncService.cancelFromStripe).toBe('function');
    expect(
      Object.keys(sync.subscriptionSyncService).some((k) => /iyzico/i.test(k))
    ).toBe(false);
  });
});
