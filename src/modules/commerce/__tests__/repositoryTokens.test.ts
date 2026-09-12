/**
 * Commerce Repository — token bazlı order arama + crypto lisans anahtarı
 *
 * item 2: license key / order number üretimi crypto.randomBytes ile
 *         (`repository.test.ts` format testlerini kapsar; burada crypto'nun
 *          GERÇEKTEN kullanıldığı ve Math.random'ın kullanılmadığı doğrulanır)
 * item 3: iyzico token'ı ile order eşleşmesi repository metoduyla yapılır
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    license: { findUnique: vi.fn(), update: vi.fn() },
    customer: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    plan: { findMany: vi.fn(), findUnique: vi.fn() },
    digitalProduct: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import {
  orderRepository,
  licenseRepository,
  generateLicenseKeyValue,
} from '../repository';

describe('OrderRepository.findByProviderToken (item 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unique kolonda findUnique kullanır (findFirst DEĞİL)', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ id: 'o1' } as any);

    await orderRepository.findByProviderToken('iyz_token_1');

    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { stripeSessionId: 'iyz_token_1' },
      include: { items: true, licenses: true, customer: true },
    });
    expect(prisma.order.findFirst).not.toHaveBeenCalled();
  });

  it('items/licenses/customer ilişkilerini include eder', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ id: 'o1' } as any);

    await orderRepository.findByProviderToken('tok');

    const arg = vi.mocked(prisma.order.findUnique).mock.calls[0]![0] as any;
    expect(arg.include).toEqual({ items: true, licenses: true, customer: true });
  });

  it('boş token için DB.ye hiç gitmez, null döner', async () => {
    await expect(orderRepository.findByProviderToken('')).resolves.toBeNull();
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
  });

  it('eşleşme yoksa null döner', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);
    await expect(orderRepository.findByProviderToken('yok')).resolves.toBeNull();
  });

  it('aynı token için deterministik sonuç döner (callback yenilemesi güvenli)', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ id: 'o1' } as any);

    const a = await orderRepository.findByProviderToken('tok');
    const b = await orderRepository.findByProviderToken('tok');

    expect(a).toEqual(b);
  });

  it('findByStripeSession ile aynı order.a erişir (kolon paylaşımı)', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ id: 'o1' } as any);

    await orderRepository.findByStripeSession('tok');
    const stripeArg = vi.mocked(prisma.order.findUnique).mock.calls[0]![0] as any;

    vi.clearAllMocks();
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ id: 'o1' } as any);
    await orderRepository.findByProviderToken('tok');
    const tokenArg = vi.mocked(prisma.order.findUnique).mock.calls[0]![0] as any;

    expect(tokenArg.where).toEqual(stripeArg.where);
  });
});

describe('generateLicenseKeyValue — crypto tabanlı (item 2)', () => {
  it('varsayılan NOKT prefix ve 4x4 segment formatı', () => {
    expect(generateLicenseKeyValue()).toMatch(/^NOKT(-[A-Z0-9]{4}){4}$/);
  });

  it('özel prefix destekler (bundle lisansları için)', () => {
    expect(generateLicenseKeyValue('BUNDLE')).toMatch(/^BUNDLE(-[A-Z0-9]{4}){4}$/);
  });

  it('crypto.randomBytes kullanır (Math.random DEĞİL)', () => {
    const randomBytesSpy = vi.spyOn(crypto, 'randomBytes');
    const mathRandomSpy = vi.spyOn(Math, 'random');

    generateLicenseKeyValue();

    expect(randomBytesSpy).toHaveBeenCalled();
    expect(mathRandomSpy).not.toHaveBeenCalled();

    randomBytesSpy.mockRestore();
    mathRandomSpy.mockRestore();
  });

  it('her segment için 2 byte (toplam 8 byte / 64 bit entropy) çeker', () => {
    const randomBytesSpy = vi.spyOn(crypto, 'randomBytes');

    generateLicenseKeyValue();

    const totalBytes = randomBytesSpy.mock.calls.reduce(
      (sum, c) => sum + (c[0] as number),
      0
    );
    expect(totalBytes).toBe(8);

    randomBytesSpy.mockRestore();
  });

  it('1000 anahtarın hepsi benzersiz', () => {
    const keys = new Set(Array.from({ length: 1000 }, () => generateLicenseKeyValue()));
    expect(keys.size).toBe(1000);
  });

  it('yalnızca büyük harf ve rakam içerir', () => {
    for (let i = 0; i < 50; i++) {
      const key = generateLicenseKeyValue();
      expect(key).toBe(key.toUpperCase());
      expect(key.replace(/-/g, '')).toMatch(/^[A-Z0-9]+$/);
    }
  });

  it('licenseRepository.generateKey aynı üreticiyi kullanır', async () => {
    const key = await licenseRepository.generateKey();
    expect(key).toMatch(/^NOKT(-[A-Z0-9]{4}){4}$/);
  });

  it('orderRepository.generateOrderNumber Math.random kullanmaz', async () => {
    const mathRandomSpy = vi.spyOn(Math, 'random');
    await orderRepository.generateOrderNumber();
    expect(mathRandomSpy).not.toHaveBeenCalled();
    mathRandomSpy.mockRestore();
  });
});
