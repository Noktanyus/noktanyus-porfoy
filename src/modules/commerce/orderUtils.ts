/**
 * @file orderUtils.ts
 * Sipariş kalemleri (Order Items) ve sipariş metadata'sını çözümlemek için yardımcı fonksiyonlar.
 *
 * Dijital ürün siparişleri DB'de `OrderItem` tablosuna yazılırken;
 * Abonelik (Plan), API Kredi Paketi ve Bahşiş/Destek siparişleri
 * `Order.metadata` ve `Order.notes` alanlarında saklanır.
 *
 * `resolveOrderItems` fonksiyonu, her iki sipariş türünü de homojen
 * bir `ResolvedOrderItem[]` dizisine dönüştürerek Dashboard, Billing ve
 * Email şablonlarında ürün verilerinin her zaman eksiksiz görünmesini sağlar.
 */

export interface ResolvedOrderItem {
  id: string;
  productTitle: string;
  productSlug?: string | null;
  href?: string | null;
  badge?: string | null;
  badgeTone?: 'brand' | 'success' | 'warning' | 'info' | 'neutral';
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  description?: string | null;
}

export interface OrderLike {
  id: string;
  orderNumber?: string;
  totalCents: number;
  subtotalCents?: number | null;
  currency?: string;
  notes?: string | null;
  metadata?: unknown;
  items?: Array<{
    id: string;
    productTitle?: string | null;
    productSlug?: string | null;
    quantity?: number | null;
    unitPriceCents?: number | null;
    totalCents?: number | null;
    product?: { id: string; slug: string; title: string } | null;
  }> | null;
}

function parseOrderMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata) return {};
  if (typeof metadata === 'object' && metadata !== null) {
    return metadata as Record<string, unknown>;
  }
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Bir siparişin kalemlerini eksiksiz çözer.
 * Eğer `order.items` boşsa, `metadata` ve `notes` alanlarını inceleyerek
 * abonelik / kredi / bahşiş veya genel hizmet bilgisini satır haline getirir.
 */
export function resolveOrderItems(order: OrderLike): ResolvedOrderItem[] {
  // 1. Doğrudan OrderItem kayıtları varsa bunları kullan
  if (order.items && order.items.length > 0) {
    return order.items.map((item, index) => {
      const title = item.productTitle || item.product?.title || 'Dijital Ürün';
      const slug = item.productSlug || item.product?.slug || '';
      const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
      const unitPriceCents =
        typeof item.unitPriceCents === 'number'
          ? item.unitPriceCents
          : typeof item.totalCents === 'number'
          ? Math.round(item.totalCents / quantity)
          : order.totalCents;
      const totalCents =
        typeof item.totalCents === 'number' ? item.totalCents : unitPriceCents * quantity;

      return {
        id: item.id || `item-${order.id}-${index}`,
        productTitle: title,
        productSlug: slug || null,
        href: slug ? `/magaza/${slug}` : null,
        quantity,
        unitPriceCents,
        totalCents,
      };
    });
  }

  // 2. OrderItem yok — metadata & notes analizi
  const meta = parseOrderMetadata(order.metadata);
  const notes = order.notes?.trim() || '';
  const metaType = typeof meta.type === 'string' ? meta.type.toLowerCase() : '';
  const totalCents = order.totalCents ?? 0;
  const unitPriceCents =
    typeof order.subtotalCents === 'number' && order.subtotalCents > 0
      ? order.subtotalCents
      : totalCents;

  // Durum A: Abonelik / Plan siparişi
  const isSubscription =
    metaType === 'subscription' ||
    notes.toLowerCase().startsWith('abonelik') ||
    Boolean(meta.planSlug) ||
    Boolean(meta.planId);

  if (isSubscription) {
    const planSlug = typeof meta.planSlug === 'string' ? meta.planSlug : '';
    const interval = typeof meta.interval === 'string' ? meta.interval.toUpperCase() : '';
    const intervalLabel = interval === 'YEAR' ? 'Yıllık' : interval === 'MONTH' ? 'Aylık' : '';

    let title = notes;
    if (!title && planSlug) {
      title = `${capitalize(planSlug)} Planı${intervalLabel ? ` (${intervalLabel})` : ' Aboneliği'}`;
    } else if (!title) {
      title = 'Abonelik Planı';
    }

    return [
      {
        id: `sub-${order.id}`,
        productTitle: title,
        productSlug: planSlug || 'abonelikler',
        href: '/magaza/abonelikler',
        badge: 'Abonelik',
        badgeTone: 'brand',
        quantity: 1,
        unitPriceCents,
        totalCents,
        description: intervalLabel ? `${intervalLabel} yenilenen abonelik paketi` : 'Abonelik planı',
      },
    ];
  }

  // Durum B: API Kredi Top-up
  const isApiTopup =
    metaType === 'api_topup' ||
    notes.toLowerCase().startsWith('api kredi') ||
    typeof meta.credits === 'number';

  if (isApiTopup) {
    const credits = typeof meta.credits === 'number' ? meta.credits : null;
    let title = notes;
    if (!title && credits) {
      title = `API Kredi Paketi (${credits.toLocaleString('tr-TR')} Kredi)`;
    } else if (!title) {
      title = 'API Kredi Paketi';
    }

    return [
      {
        id: `credit-${order.id}`,
        productTitle: title,
        productSlug: 'kredi',
        href: '/magaza/kredi',
        badge: 'API Kredi',
        badgeTone: 'info',
        quantity: 1,
        unitPriceCents,
        totalCents,
        description: credits
          ? `${credits.toLocaleString('tr-TR')} adet API çağrı kredisi`
          : 'API kullanım kredisi',
      },
    ];
  }

  // Durum C: Destek / Bahşiş (Tip)
  const isTip =
    metaType === 'tip' ||
    notes.toLowerCase().includes('destek') ||
    notes.toLowerCase().includes('bahşiş');

  if (isTip) {
    const message = typeof meta.message === 'string' && meta.message ? meta.message : undefined;
    const title = notes || 'Geliştiriciye Destek / Bahşiş';

    return [
      {
        id: `tip-${order.id}`,
        productTitle: title,
        productSlug: 'bahsis',
        href: '/bahsis',
        badge: 'Destek',
        badgeTone: 'success',
        quantity: 1,
        unitPriceCents: totalCents,
        totalCents,
        description: message ? `Mesaj: "${message}"` : 'Proje desteği',
      },
    ];
  }

  // Durum D: Genel Hizmet / Sipariş (Fallback)
  const fallbackTitle =
    notes ||
    (typeof meta.title === 'string' ? meta.title : null) ||
    (typeof meta.name === 'string' ? meta.name : null) ||
    'Sipariş Hizmeti';

  return [
    {
      id: `custom-${order.id}`,
      productTitle: fallbackTitle,
      productSlug: null,
      href: null,
      badge: 'Hizmet',
      badgeTone: 'neutral',
      quantity: 1,
      unitPriceCents,
      totalCents,
    },
  ];
}

/**
 * Sipariş için kısa tek satırlık başlık özeti döner (Örn: "Starter Planı +1" veya "Next.js SaaS Starter Kit").
 */
export function getOrderSummaryTitle(order: OrderLike): { title: string; extraCount: number } {
  const items = resolveOrderItems(order);
  const first = items[0]?.productTitle || 'Sipariş';
  const extraCount = Math.max(0, items.length - 1);
  return { title: first, extraCount };
}
