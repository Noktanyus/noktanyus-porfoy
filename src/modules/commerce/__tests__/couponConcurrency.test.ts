/**
 * Coupon Redemption — Atomik kullanım artışı ve yarış durumu (item 5)
 *
 * `redeem()` içindeki compare-and-set mantığını doğrular. Prisma mock yapısı
 * mevcut testlerdeki stil ile aynı: `vi.mock('@/lib/prisma')` + `$transaction`
 * callback'ine sahte bir `tx` verilir.
 *
 * Yarış durumu simülasyonu: `tx.coupon.updateMany` gerçek bir SQL
 * `UPDATE ... WHERE currentUses < maxUses` gibi davranır — PAYLAŞILAN bir sayaç
 * üzerinden koşulu kontrol eder, sağlanırsa artırır ve `{ count: 1 }` döner,
 * sağlanmazsa `{ count: 0 }`. Böylece "iki istek aynı anda" senaryosunda
 * yalnızca birinin kazandığı gerçek DB davranışıyla aynı şekilde test edilir.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    coupon: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    couponRedemption: {
      create: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from '@/lib/prisma';
import { couponService } from '../couponService';

/**
 * Paylaşılan sayaç üzerinde çalışan, atomik UPDATE davranışını taklit eden
 * sahte bir DB. `$transaction` her çağrıldığında bu store'a bağlı yeni bir tx
 * verir — yani eşzamanlı iki `redeem()` AYNI sayacı görür.
 */
function makeCouponStore(opts: { maxUses: number | null; currentUses?: number }) {
  const store = {
    id: 'c1',
    maxUses: opts.maxUses,
    currentUses: opts.currentUses ?? 0,
    redemptions: [] as Array<{ couponId: string; customerEmail: string }>,
  };

  const tx = {
    coupon: {
      findUnique: vi.fn(
        async (): Promise<{ id: string; maxUses: number | null } | null> => ({
          id: store.id,
          maxUses: store.maxUses,
        })
      ),
      // Koşulsuz increment (maxUses === null yolu)
      update: vi.fn(async () => {
        store.currentUses += 1;
        return { ...store };
      }),
      // Atomik compare-and-set: UPDATE ... WHERE currentUses < maxUses
      updateMany: vi.fn(async (args: any) => {
        const limit = args?.where?.currentUses?.lt;
        if (typeof limit === 'number' && store.currentUses >= limit) {
          return { count: 0 };
        }
        store.currentUses += 1;
        return { count: 1 };
      }),
    },
    couponRedemption: {
      create: vi.fn(async (args: any) => {
        const row = { id: `r${store.redemptions.length + 1}`, ...args.data };
        store.redemptions.push(row);
        return row;
      }),
    },
  };

  // Gerçek Prisma gibi callback'i çalıştırır. Geri sarma (rollback) BİLİNÇLİ
  // olarak modellenmiyor: `redeem()` limit aşımında sayacı artırmadan ve
  // redemption oluşturmadan önce fırlatır, yani geri sarılacak bir mutasyon
  // yoktur. Snapshot/restore eklemek eşzamanlı senaryoda kazanan işlemin
  // yazdığını da silerdi (bayat snapshot) — gerçek satır kilitleri böyle
  // davranmaz.
  vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(tx));

  return { store, tx };
}

describe('couponService.redeem — atomik kullanım artışı', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('limitsiz kuponda koşulsuz increment kullanır (updateMany değil)', async () => {
    const { store, tx } = makeCouponStore({ maxUses: null });

    await couponService.redeem('c1', 'a@b.com', 'o1', 500);

    expect(tx.coupon.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { currentUses: { increment: 1 } },
    });
    expect(tx.coupon.updateMany).not.toHaveBeenCalled();
    expect(store.currentUses).toBe(1);
    expect(store.redemptions).toHaveLength(1);
  });

  it('limitli kuponda koşullu updateMany (compare-and-set) kullanır', async () => {
    const { store, tx } = makeCouponStore({ maxUses: 5, currentUses: 2 });

    await couponService.redeem('c1', 'a@b.com', 'o1', 500);

    expect(tx.coupon.updateMany).toHaveBeenCalledWith({
      where: { id: 'c1', currentUses: { lt: 5 } },
      data: { currentUses: { increment: 1 } },
    });
    expect(tx.coupon.update).not.toHaveBeenCalled();
    expect(store.currentUses).toBe(3);
  });

  it('sayaç ile artış sırası doğru: ÖNCE sayaç, SONRA redemption', async () => {
    const order: string[] = [];
    const { tx } = makeCouponStore({ maxUses: 1 });
    tx.coupon.updateMany.mockImplementation(async () => {
      order.push('counter');
      return { count: 1 };
    });
    tx.couponRedemption.create.mockImplementation(async () => {
      order.push('redemption');
      return { id: 'r1' };
    });

    await couponService.redeem('c1', 'a@b.com', 'o1', 500);

    // Ters sırada olsaydı limiti kaybeden istek de redemption satırı bırakırdı.
    expect(order).toEqual(['counter', 'redemption']);
  });

  it('limit dolmuşsa hata fırlatır ve redemption OLUŞTURMAZ', async () => {
    const { store, tx } = makeCouponStore({ maxUses: 1, currentUses: 1 });

    await expect(couponService.redeem('c1', 'a@b.com', 'o1', 500)).rejects.toThrow(
      /limit/i
    );

    expect(tx.couponRedemption.create).not.toHaveBeenCalled();
    expect(store.currentUses).toBe(1);
    expect(store.redemptions).toHaveLength(0);
  });

  it('kupon bulunamazsa hata fırlatır', async () => {
    const { tx } = makeCouponStore({ maxUses: 1 });
    tx.coupon.findUnique.mockResolvedValue(null);

    await expect(couponService.redeem('missing', 'a@b.com', null, 100)).rejects.toThrow(
      /Kupon/
    );
    expect(tx.couponRedemption.create).not.toHaveBeenCalled();
  });
});

describe('couponService.redeem — yarış durumu (concurrency)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tek kullanımlık kuponda eşzamanlı 2 redeem.ten yalnızca 1.i başarılı olur', async () => {
    const { store } = makeCouponStore({ maxUses: 1, currentUses: 0 });

    const results = await Promise.allSettled([
      couponService.redeem('c1', 'a@b.com', 'o1', 500),
      couponService.redeem('c1', 'b@b.com', 'o2', 500),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    // KRİTİK: sayaç maxUses'i AŞMADI (eski kodda 2 olurdu).
    expect(store.currentUses).toBe(1);
    expect(store.redemptions).toHaveLength(1);
  });

  it('maxUses=3 kuponda eşzamanlı 10 redeem.ten tam 3.ü başarılı olur', async () => {
    const { store } = makeCouponStore({ maxUses: 3, currentUses: 0 });

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) =>
        couponService.redeem('c1', `user${i}@b.com`, `o${i}`, 100)
      )
    );

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled).toHaveLength(3);
    expect(store.currentUses).toBe(3);
    expect(store.redemptions).toHaveLength(3);
  });

  it('limitsiz kuponda eşzamanlı 5 redeem.in hepsi başarılı olur', async () => {
    const { store } = makeCouponStore({ maxUses: null });

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, i) =>
        couponService.redeem('c1', `user${i}@b.com`, `o${i}`, 100)
      )
    );

    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    expect(store.currentUses).toBe(5);
  });
});
