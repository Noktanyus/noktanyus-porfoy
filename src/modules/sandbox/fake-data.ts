/**
 * @file Sandbox Fake Data Generator
 * @description D2: Sandbox'ta test için sentetik veri üretir.
 *              PII (gerçek kişisel bilgi) içermez.
 *              Production'da bu modül hiç import edilmemeli.
 */

export interface FakeUser {
  email: string;
  name: string;
  role: "user" | "admin" | "moderator";
}

export interface FakeOrder {
  customerEmail: string;
  totalAmount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  itemCount: number;
}

export interface FakeProduct {
  name: string;
  price: number;
  currency: string;
  description: string;
}

/**
 * Türkçe + İngilizce karışık sahte isimler.
 */
const FAKE_FIRST_NAMES = [
  "Ahmet", "Ayşe", "Mehmet", "Fatma", "Ali", "Zeynep",
  "Mustafa", "Elif", "Test", "Demo", "Sample", "Mock",
];
const FAKE_LAST_NAMES = [
  "Yılmaz", "Demir", "Kaya", "Çelik", "Doğan", "Aydın",
  "User", "Tester", "Demo", "Sample",
];

/**
 * Seeded random — test reproducibility.
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  next(): number {
    // LCG (Linear Congruential Generator) — basit ve hızlı
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: ReadonlyArray<T>): T {
    return arr[this.nextInt(0, arr.length - 1)] as T;
  }
}

let globalRandom = new SeededRandom();

export function seedFakeData(seed: number): void {
  globalRandom = new SeededRandom(seed);
}

/**
 * Sahte kullanıcı üret.
 */
export function generateFakeUser(): FakeUser {
  const firstName = globalRandom.pick(FAKE_FIRST_NAMES);
  const lastName = globalRandom.pick(FAKE_LAST_NAMES);
  const role = globalRandom.pick(["user", "user", "user", "admin", "moderator"]) as
    | "user"
    | "admin"
    | "moderator";

  return {
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@sandbox.test`,
    name: `${firstName} ${lastName}`,
    role,
  };
}

/**
 * Sahte sipariş üret.
 */
export function generateFakeOrder(): FakeOrder {
  const statuses = ["pending", "paid", "paid", "paid", "failed", "refunded"] as const;
  const currencies = ["TRY", "USD", "EUR"] as const;

  return {
    customerEmail: generateFakeUser().email,
    totalAmount: globalRandom.nextInt(50, 5000),
    currency: globalRandom.pick(currencies),
    status: globalRandom.pick(statuses),
    itemCount: globalRandom.nextInt(1, 10),
  };
}

/**
 * Sahte ürün üret.
 */
export function generateFakeProduct(): FakeProduct {
  const names = [
    "Premium Üyelik",
    "Pro Plan",
    "Starter Paket",
    "Enterprise Lisans",
    "Test Ürünü",
    "Demo Item",
  ];
  const currencies = ["TRY", "USD", "EUR"] as const;

  return {
    name: globalRandom.pick(names),
    price: globalRandom.nextInt(99, 9999),
    currency: globalRandom.pick(currencies),
    description: "Sandbox tarafından üretilmiş sahte veri",
  };
}

/**
 * Toplu fake veri üret (bulk seeding için).
 */
export function generateBatch<T>(
  generator: () => T,
  count: number
): T[] {
  return Array.from({ length: count }, () => generator());
}

/**
 * Sandbox ortamında olduğumuzu doğrula — guard.
 * Production'da bu fonksiyon throw eder.
 */
export function assertSandboxMode(): void {
  if (process.env.SANDBOX_MODE !== "true") {
    throw new Error(
      "Bu fonksiyon sadece SANDBOX_MODE=true ortamında çalışmalıdır. " +
        "Production'da fake data generator kullanılamaz."
    );
  }
}