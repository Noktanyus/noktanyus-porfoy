/**
 * iyzico itemType / product type tutarlılığı (item 8)
 *
 * `IyzicoBasketItem.itemType` union'ı ('PHYSICAL' | 'VIRTUAL') MEVCUT tiptir;
 * yeni bir kavram eklenmedi. Önceden 'VIRTUAL' string literal'i üç yerde ayrı
 * ayrı yazılıydı ve `iyzicoSubscriptionService` ham SDK objesi kurduğu için
 * union'a karşı hiç kontrol edilmiyordu.
 *
 * Bu testler paylaşılan sabitin gerçekten her iki çağrı yolunda kullanıldığını
 * ve iyzico'ya gönderilen basketItems'ın beklenen şekle sahip olduğunu sabitler.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { IYZICO_DIGITAL_ITEM_TYPE, type IyzicoItemType } from '@/lib/iyzico';

describe('IYZICO_DIGITAL_ITEM_TYPE sabiti', () => {
  it('mevcut union değerlerinden biridir', () => {
    const allowed: IyzicoItemType[] = ['PHYSICAL', 'VIRTUAL'];
    expect(allowed).toContain(IYZICO_DIGITAL_ITEM_TYPE);
  });

  it('dijital ürün/abonelik için VIRTUAL.dir', () => {
    expect(IYZICO_DIGITAL_ITEM_TYPE).toBe('VIRTUAL');
  });
});

describe('iyzicoService.createCheckout — basketItems şekli', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('itemType verilmezse paylaşılan sabite düşer', async () => {
    const iyzicoLib = await import('@/lib/iyzico');
    vi.spyOn(iyzicoLib, 'isIyzicoConfigured').mockReturnValue(true);

    const create = vi.fn((_b: unknown, cb: (e: unknown, r: unknown) => void) =>
      cb(null, { status: 'success', token: 't', paymentPageUrl: 'u' })
    );
    vi.spyOn(iyzicoLib, 'getIyzico').mockReturnValue({
      checkoutFormInitialize: { create },
      checkoutForm: { retrieve: vi.fn() },
    } as any);

    const { iyzicoService } = await import('../iyzicoService');
    await iyzicoService.createCheckout({
      items: [{ id: 'p1', name: 'Ürün', category: 'general', price: '100.00' }],
      totalPrice: '100.00',
      customerEmail: 'a@b.com',
      callbackUrl: '/cb',
    });

    const body = create.mock.calls[0]![0] as any;
    expect(body.basketItems).toEqual([
      {
        id: 'p1',
        name: 'Ürün',
        category1: 'general',
        itemType: 'VIRTUAL',
        price: '100.00',
      },
    ]);
  });

  it('explicit itemType korunur (union.a saygı duyulur)', async () => {
    const iyzicoLib = await import('@/lib/iyzico');
    vi.spyOn(iyzicoLib, 'isIyzicoConfigured').mockReturnValue(true);

    const create = vi.fn((_b: unknown, cb: (e: unknown, r: unknown) => void) =>
      cb(null, { status: 'success', token: 't', paymentPageUrl: 'u' })
    );
    vi.spyOn(iyzicoLib, 'getIyzico').mockReturnValue({
      checkoutFormInitialize: { create },
      checkoutForm: { retrieve: vi.fn() },
    } as any);

    const { iyzicoService } = await import('../iyzicoService');
    await iyzicoService.createCheckout({
      items: [
        {
          id: 'p1',
          name: 'Kargo',
          category: 'general',
          itemType: 'PHYSICAL',
          price: '10.00',
        },
      ],
      totalPrice: '10.00',
      customerEmail: 'a@b.com',
      callbackUrl: '/cb',
    });

    const body = create.mock.calls[0]![0] as any;
    expect(body.basketItems[0].itemType).toBe('PHYSICAL');
  });

  it('tek çekim akışı paymentGroup=PRODUCT kullanır', async () => {
    const iyzicoLib = await import('@/lib/iyzico');
    vi.spyOn(iyzicoLib, 'isIyzicoConfigured').mockReturnValue(true);

    const create = vi.fn((_b: unknown, cb: (e: unknown, r: unknown) => void) =>
      cb(null, { status: 'success', token: 't', paymentPageUrl: 'u' })
    );
    vi.spyOn(iyzicoLib, 'getIyzico').mockReturnValue({
      checkoutFormInitialize: { create },
      checkoutForm: { retrieve: vi.fn() },
    } as any);

    const { iyzicoService } = await import('../iyzicoService');
    await iyzicoService.createCheckout({
      items: [{ id: 'p1', name: 'Ürün', category: 'general', price: '100.00' }],
      totalPrice: '100.00',
      customerEmail: 'a@b.com',
      callbackUrl: '/cb',
    });

    expect((create.mock.calls[0]![0] as any).paymentGroup).toBe('PRODUCT');
  });
});

describe('iyzicoSubscriptionService — basketItems şekli', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('abonelik kalemi de paylaşılan itemType sabitini kullanır', async () => {
    const iyzicoLib = await import('@/lib/iyzico');
    vi.spyOn(iyzicoLib, 'isIyzicoConfigured').mockReturnValue(true);

    const create = vi.fn((_b: unknown, cb: (e: unknown, r: unknown) => void) =>
      cb(null, { status: 'success', token: 't', paymentPageUrl: 'u' })
    );
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
    await iyzicoSubscriptionService.createSubscriptionCheckout({
      planSlug: 'pro',
      customerEmail: 'a@b.com.tr',
      callbackUrl: '/cb',
    });

    const body = create.mock.calls[0]![0] as any;
    expect(body.basketItems).toHaveLength(1);
    expect(body.basketItems[0]).toMatchObject({
      id: 'plan_1',
      category1: 'subscription',
      itemType: IYZICO_DIGITAL_ITEM_TYPE,
      price: '299.00',
    });
  });

  it('plan fiyatı kuruştan TL string.e doğru çevrilir', async () => {
    const iyzicoLib = await import('@/lib/iyzico');
    vi.spyOn(iyzicoLib, 'isIyzicoConfigured').mockReturnValue(true);

    const create = vi.fn((_b: unknown, cb: (e: unknown, r: unknown) => void) =>
      cb(null, { status: 'success', token: 't', paymentPageUrl: 'u' })
    );
    vi.spyOn(iyzicoLib, 'getIyzico').mockReturnValue({
      checkoutFormInitialize: { create },
      checkoutForm: { retrieve: vi.fn() },
    } as any);

    vi.doMock('@/lib/prisma', () => ({
      prisma: {
        plan: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'plan_1',
            slug: 'basic',
            name: 'Basic',
            priceCents: 999,
            currency: 'try',
          }),
        },
      },
    }));

    const { iyzicoSubscriptionService } = await import('../iyzicoSubscriptionService');
    await iyzicoSubscriptionService.createSubscriptionCheckout({
      planSlug: 'basic',
      customerEmail: 'a@b.com.tr',
      callbackUrl: '/cb',
    });

    const body = create.mock.calls[0]![0] as any;
    expect(body.price).toBe('9.99');
    expect(body.paidPrice).toBe('9.99');
    expect(body.basketItems[0].price).toBe('9.99');
  });
});
