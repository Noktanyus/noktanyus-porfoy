/**
 * Commerce Module — Repository Layer
 *
 * Plan, DigitalProduct, Customer, Order, License için Prisma-backed repository'ler.
 */

import crypto from 'crypto';
import { BaseRepository } from '../shared/repository';
import { prisma } from '@/lib/prisma';
import type {
  Plan,
  Subscription,
  DigitalProduct,
  Order,
  OrderItem,
  License,
  Customer,
} from '@prisma/client';

/**
 * Crypto-secure uppercase alphanumeric segment üretir (URL-safe değil).
 * Math.random yerine crypto.randomBytes kullanır — order/license ID'leri
 * saldırgan tarafından tahmin edilememeli.
 */
function secureAlnum(bytes: number): string {
  return crypto
    .randomBytes(bytes)
    .toString('hex')
    .toUpperCase()
    .slice(0, bytes * 2);
}

/**
 * Tahmin edilemez lisans anahtarı üretir: `PREFIX-XXXX-XXXX-XXXX-XXXX`.
 *
 * `LicenseRepository.generateKey()` ve `bundleService.purchase()` aynı üreticiyi
 * paylaşır — bundle lisansları eskiden `Math.random().toString(36)` ile
 * üretiliyordu (tahmin edilebilir, ödeme yapmadan lisans türetilebilir).
 */
export function generateLicenseKeyValue(prefix = 'NOKT'): string {
  // 4 segment × 4 hex char = 16 hex char → 8 byte (64 bit) entropy.
  const segments = Array.from({ length: 4 }, () => secureAlnum(2));
  return `${prefix}-${segments.join('-')}`;
}

export class PlanRepository extends BaseRepository<Plan> {
  protected get model() {
    return this.prisma.plan;
  }

  async findActive() {
    return this.prisma.plan.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.plan.findUnique({ where: { slug } });
  }

  async findByStripePriceId(stripePriceId: string) {
    return this.prisma.plan.findUnique({ where: { stripePriceId } });
  }
}

export class ProductRepository extends BaseRepository<DigitalProduct> {
  protected get model() {
    return this.prisma.digitalProduct;
  }

  async findActive(opts?: { skip?: number; take?: number; category?: string }) {
    return this.prisma.digitalProduct.findMany({
      where: {
        active: true,
        ...(opts?.category ? { category: opts.category } : {}),
      },
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      skip: opts?.skip,
      take: opts?.take ?? 20,
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.digitalProduct.findUnique({ where: { slug } });
  }
}

export class CustomerRepository extends BaseRepository<Customer> {
  protected get model() {
    return this.prisma.customer;
  }

  async findByEmail(email: string) {
    return this.prisma.customer.findUnique({ where: { email } });
  }

  async findByStripeId(stripeCustomerId: string) {
    return this.prisma.customer.findUnique({ where: { stripeCustomerId } });
  }

  async getOrCreate(data: { email: string; name?: string; stripeCustomerId?: string }) {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      return this.prisma.customer.update({
        where: { id: existing.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.stripeCustomerId && { stripeCustomerId: data.stripeCustomerId }),
        },
      });
    }
    return this.prisma.customer.create({ data });
  }
}

export class OrderRepository extends BaseRepository<Order> {
  protected get model() {
    return this.prisma.order;
  }

  async findByStripeSession(stripeSessionId: string) {
    return this.prisma.order.findUnique({
      where: { stripeSessionId },
      include: { items: true, licenses: true, customer: true },
    });
  }

  /**
   * Ödeme sağlayıcısı token'ı ile order bulur.
   *
   * iyzico'da checkout token'ı `stripeSessionId` kolonunda tutuluyor (kolon adı
   * tarihsel; alan provider'dan bağımsız "session/token" anlamında kullanılıyor).
   * Callback route'u önceden `prisma.order.findFirst` ile ARAMA yapıyordu:
   *   - unique kolonda findFirst gereksiz (index'i tam kullanmaz)
   *   - include etmediği için items/customer gelmiyordu
   *   - sorgu mantığı route'a sızmıştı
   *
   * findUnique kullanılıyor: kolon `@unique`, yani token → en fazla 1 order.
   * Bu da callback'in aynı token'la iki kez çağrılmasını (kullanıcı sayfayı
   * yenilerse) deterministik kılar.
   */
  async findByProviderToken(token: string) {
    if (!token) return null;
    return this.prisma.order.findUnique({
      where: { stripeSessionId: token },
      include: { items: true, licenses: true, customer: true },
    });
  }

  async findByCustomer(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    // 3 byte = 6 hex chars — order number için yeterli entropy.
    const random = secureAlnum(3);
    return `NK-${year}${month}-${random}`;
  }
}

export class LicenseRepository extends BaseRepository<License> {
  protected get model() {
    return this.prisma.license;
  }

  async findByKey(key: string) {
    return this.prisma.license.findUnique({ where: { key } });
  }

  async generateKey() {
    // License format: NOKT-XXXX-XXXX-XXXX-XXXX
    // Math.random ile ~52 bit entropy / tahmin edilebilirlik riski vardi.
    return generateLicenseKeyValue('NOKT');
  }

  async activate(licenseKey: string, domain: string, ip: string) {
    const license = await this.findByKey(licenseKey);
    if (!license) throw new Error('License not found');
    if (license.status !== 'active') throw new Error('License inactive');
    if (license.currentActivations >= license.maxActivations) {
      throw new Error('Max activations reached');
    }

    const activations = Array.isArray(license.activations)
      ? (license.activations as unknown[])
      : [];
    return this.prisma.license.update({
      where: { id: license.id },
      data: {
        currentActivations: { increment: 1 },
        activations: [
          ...activations,
          { domain, ip, timestamp: new Date().toISOString() },
        ] as unknown as object,
      },
    });
  }
}

export const planRepository = new PlanRepository();
export const productRepository = new ProductRepository();
export const customerRepository = new CustomerRepository();
export const orderRepository = new OrderRepository();
export const licenseRepository = new LicenseRepository();

// Geriye uyumluluk (eski barrel export'ları için)
export class CommerceRepository extends BaseRepository<Record<string, unknown>> {
  protected get model() {
    return null as unknown as never;
  }
}
export const commerceRepository = new CommerceRepository();