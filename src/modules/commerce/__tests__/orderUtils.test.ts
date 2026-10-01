import { describe, it, expect } from 'vitest';
import { resolveOrderItems, getOrderSummaryTitle } from '../orderUtils';

describe('orderUtils - resolveOrderItems', () => {
  it('resolves normal digital product items correctly', () => {
    const order = {
      id: 'ord-1',
      orderNumber: 'NK-2609-001',
      totalCents: 19900,
      subtotalCents: 19900,
      currency: 'try',
      items: [
        {
          id: 'item-1',
          productTitle: 'Next.js 14 SaaS Starter Kit',
          productSlug: 'nextjs-saas-starter',
          quantity: 1,
          unitPriceCents: 19900,
          totalCents: 19900,
        },
      ],
    };

    const resolved = resolveOrderItems(order);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]).toEqual({
      id: 'item-1',
      productTitle: 'Next.js 14 SaaS Starter Kit',
      productSlug: 'nextjs-saas-starter',
      href: '/magaza/nextjs-saas-starter',
      quantity: 1,
      unitPriceCents: 19900,
      totalCents: 19900,
    });
  });

  it('resolves subscription order with metadata when items array is empty', () => {
    const order = {
      id: 'ord-sub-1',
      orderNumber: 'NK-2610-1B783F',
      totalCents: 29900,
      subtotalCents: 29900,
      currency: 'try',
      notes: 'Abonelik: Pro',
      metadata: {
        type: 'subscription',
        planSlug: 'pro',
        planId: 'plan-pro-id',
        interval: 'MONTH',
      },
      items: [],
    };

    const resolved = resolveOrderItems(order);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].productTitle).toBe('Abonelik: Pro');
    expect(resolved[0].badge).toBe('Abonelik');
    expect(resolved[0].href).toBe('/magaza/abonelikler');
    expect(resolved[0].quantity).toBe(1);
    expect(resolved[0].totalCents).toBe(29900);
    expect(resolved[0].unitPriceCents).toBe(29900);
  });

  it('resolves subscription order when notes is missing but metadata has planSlug', () => {
    const order = {
      id: 'ord-sub-2',
      orderNumber: 'NK-2610-D7B9E4',
      totalCents: 29900,
      subtotalCents: 29900,
      currency: 'try',
      metadata: {
        type: 'subscription',
        planSlug: 'pro',
        interval: 'YEAR',
      },
      items: [],
    };

    const resolved = resolveOrderItems(order);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].productTitle).toBe('Pro Planı (Yıllık)');
    expect(resolved[0].badge).toBe('Abonelik');
    expect(resolved[0].description).toContain('Yıllık');
  });

  it('resolves API credit topup orders', () => {
    const order = {
      id: 'ord-credit-1',
      orderNumber: 'NK-2609-CRED',
      totalCents: 5000,
      notes: 'API kredi: 1.000 API Kredisi',
      metadata: {
        type: 'api_topup',
        packSlug: 'starter-pack',
        credits: 1000,
      },
      items: [],
    };

    const resolved = resolveOrderItems(order);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].productTitle).toBe('API kredi: 1.000 API Kredisi');
    expect(resolved[0].badge).toBe('API Kredi');
    expect(resolved[0].href).toBe('/magaza/kredi');
    expect(resolved[0].totalCents).toBe(5000);
  });

  it('resolves tip/donation orders with custom message', () => {
    const order = {
      id: 'ord-tip-1',
      orderNumber: 'NK-2609-TIP',
      totalCents: 10000,
      notes: 'Destek notu: Harika proje!',
      metadata: {
        type: 'tip',
        message: 'Harika proje!',
      },
      items: [],
    };

    const resolved = resolveOrderItems(order);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].productTitle).toBe('Destek notu: Harika proje!');
    expect(resolved[0].badge).toBe('Destek');
    expect(resolved[0].description).toBe('Mesaj: "Harika proje!"');
  });

  it('provides safe fallback for unknown order with notes', () => {
    const order = {
      id: 'ord-custom',
      totalCents: 15000,
      notes: 'Özel Danışmanlık Hizmeti',
      items: [],
    };

    const resolved = resolveOrderItems(order);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].productTitle).toBe('Özel Danışmanlık Hizmeti');
    expect(resolved[0].badge).toBe('Hizmet');
    expect(resolved[0].totalCents).toBe(15000);
  });

  it('provides fallback for order with no metadata or notes or items', () => {
    const order = {
      id: 'ord-empty',
      totalCents: 9900,
      items: [],
    };

    const resolved = resolveOrderItems(order);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].productTitle).toBe('Sipariş Hizmeti');
    expect(resolved[0].totalCents).toBe(9900);
  });
});

describe('orderUtils - getOrderSummaryTitle', () => {
  it('returns first item title and extra count', () => {
    const order = {
      id: 'ord-multi',
      totalCents: 40000,
      items: [
        { id: '1', productTitle: 'Ürün A', quantity: 1, totalCents: 20000, unitPriceCents: 20000 },
        { id: '2', productTitle: 'Ürün B', quantity: 1, totalCents: 20000, unitPriceCents: 20000 },
      ],
    };

    const summary = getOrderSummaryTitle(order);
    expect(summary.title).toBe('Ürün A');
    expect(summary.extraCount).toBe(1);
  });

  it('returns synthetic title when items is empty', () => {
    const order = {
      id: 'ord-sub',
      totalCents: 29900,
      notes: 'Abonelik: Pro',
      items: [],
    };

    const summary = getOrderSummaryTitle(order);
    expect(summary.title).toBe('Abonelik: Pro');
    expect(summary.extraCount).toBe(0);
  });
});
