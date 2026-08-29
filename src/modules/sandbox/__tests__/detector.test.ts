/**
 * @file Sandbox module tests
 * @description D2: detector, mock payment, fake data generator testleri.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  detectSandboxMode,
  getSandboxConfig,
  getDbUrl,
  isFeatureEnabled,
  describeMode,
  type EnvironmentMode,
} from "../detector";
import {
  processMockPayment,
  processMockRefund,
  MOCK_SCENARIOS,
} from "../mock-payment";
import {
  generateFakeUser,
  generateFakeOrder,
  generateFakeProduct,
  generateBatch,
  seedFakeData,
  assertSandboxMode,
} from "../fake-data";

describe("Sandbox Detector", () => {
  beforeEach(() => {
    delete process.env.SANDBOX_MODE;
    delete process.env.STAGING_MODE;
  });

  it("default mode = production", () => {
    expect(detectSandboxMode().mode).toBe("production");
  });

  it("SANDBOX_MODE=true → sandbox", () => {
    process.env.SANDBOX_MODE = "true";
    expect(detectSandboxMode().mode).toBe("sandbox");
  });

  it("STAGING_MODE=true → staging", () => {
    process.env.STAGING_MODE = "true";
    expect(detectSandboxMode().mode).toBe("staging");
  });

  it("SANDBOX MODE öncelikli", () => {
    process.env.SANDBOX_MODE = "true";
    process.env.STAGING_MODE = "true";
    expect(detectSandboxMode().mode).toBe("sandbox");
  });

  it("getSandboxConfig 3 mode'u doner", () => {
    expect(getSandboxConfig("production").mode).toBe("production");
    expect(getSandboxConfig("staging").mode).toBe("staging");
    expect(getSandboxConfig("sandbox").mode).toBe("sandbox");
  });

  it("production'da useMockPayment false", () => {
    expect(getSandboxConfig("production").useMockPayment).toBe(false);
  });

  it("sandbox'ta useMockPayment true", () => {
    expect(getSandboxConfig("sandbox").useMockPayment).toBe(true);
  });

  it("sandbox'ta useRealPII false", () => {
    expect(getSandboxConfig("sandbox").useRealPII).toBe(false);
  });

  it("getDbUrl default namespace = baseUrl", () => {
    const url = getDbUrl("postgres://localhost/db", getSandboxConfig("production"));
    expect(url).toBe("postgres://localhost/db");
  });

  it("getDbUrl sandbox namespace schema ekler", () => {
    const url = getDbUrl("postgres://localhost/db", getSandboxConfig("sandbox"));
    expect(url).toContain("schema=sandbox");
  });

  it("getDbUrl mevcut query param'i korur", () => {
    const url = getDbUrl(
      "postgres://localhost/db?ssl=true",
      getSandboxConfig("sandbox")
    );
    expect(url).toContain("ssl=true");
    expect(url).toContain("schema=sandbox");
  });

  it("isFeatureEnabled sandbox'ta her zaman true", () => {
    process.env.SANDBOX_MODE = "true";
    expect(isFeatureEnabled("useMockPayment")).toBe(true);
    expect(isFeatureEnabled("mockExternalAPIs")).toBe(true);
  });

  it("isFeatureEnabled production'da config degerine bagli", () => {
    expect(isFeatureEnabled("useMockPayment")).toBe(false);
    expect(isFeatureEnabled("useRealPII")).toBe(true);
  });

  it("describeMode okunabilir ozet verir", () => {
    expect(describeMode(getSandboxConfig("sandbox"))).toContain("sandbox");
    expect(describeMode(getSandboxConfig("sandbox"))).toContain("mock-pay");
  });
});

describe("Mock Payment", () => {
  it("4242 kart basarili olur", async () => {
    const r = await processMockPayment({
      amount: 100,
      currency: "TRY",
      cardNumber: "4242424242424242",
      customerEmail: "test@sandbox.test",
      orderId: "ord-1",
    });
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.scenario).toBe("happy_path");
  });

  it("4000 kart reddedilir", async () => {
    const r = await processMockPayment({
      amount: 100,
      currency: "TRY",
      cardNumber: "4000000000000002",
      customerEmail: "test@sandbox.test",
      orderId: "ord-2",
    });
    expect(r.success).toBe(false);
    expect(r.status).toBe("declined");
    expect(r.scenario).toBe("card_declined");
  });

  it("5000 kart timeout olur", async () => {
    const r = await processMockPayment({
      amount: 100,
      currency: "TRY",
      cardNumber: "5000000000000000",
      customerEmail: "test@sandbox.test",
      orderId: "ord-3",
    });
    expect(r.success).toBe(false);
    expect(r.status).toBe("timeout");
  });

  it("6000 kart sistem hatasi", async () => {
    const r = await processMockPayment({
      amount: 100,
      currency: "TRY",
      cardNumber: "6000000000000000",
      customerEmail: "test@sandbox.test",
      orderId: "ord-4",
    });
    expect(r.success).toBe(false);
    expect(r.status).toBe("error");
  });

  it("kart numarasi yoksa default happy path", async () => {
    const r = await processMockPayment({
      amount: 100,
      currency: "TRY",
      customerEmail: "test@sandbox.test",
      orderId: "ord-5",
    });
    expect(r.success).toBe(true);
  });

  it("response amount ve currency'yi korur", async () => {
    const r = await processMockPayment({
      amount: 1234.56,
      currency: "EUR",
      customerEmail: "test@sandbox.test",
      orderId: "ord-6",
    });
    expect(r.amount).toBe(1234.56);
    expect(r.currency).toBe("EUR");
  });

  it("mock refund basarili olur", async () => {
    const r = await processMockRefund("tx-1", 100);
    expect(r.success).toBe(true);
    expect(r.refundId).toContain("mock-refund");
  });

  it("MOCK_SCENARIOS 4 senaryo icerir", () => {
    expect(MOCK_SCENARIOS.length).toBe(4);
    expect(MOCK_SCENARIOS.some((s) => s.outcome === "approved")).toBe(true);
    expect(MOCK_SCENARIOS.some((s) => s.outcome === "declined")).toBe(true);
  });
});

describe("Fake Data Generator", () => {
  beforeEach(() => seedFakeData(42));

  it("fake user gecerli email ve name icerir", () => {
    const u = generateFakeUser();
    expect(u.email).toMatch(/@sandbox\.test$/);
    expect(u.name).toBeTruthy();
    expect(["user", "admin", "moderator"]).toContain(u.role);
  });

  it("fake order gecerli alanlar icerir", () => {
    const o = generateFakeOrder();
    expect(o.totalAmount).toBeGreaterThan(0);
    expect(["TRY", "USD", "EUR"]).toContain(o.currency);
    expect(["pending", "paid", "failed", "refunded"]).toContain(o.status);
    expect(o.itemCount).toBeGreaterThanOrEqual(1);
  });

  it("fake product fiyat pozitif", () => {
    const p = generateFakeProduct();
    expect(p.price).toBeGreaterThan(0);
    expect(p.name).toBeTruthy();
  });

  it("generateBatch istenen sayida uretir", () => {
    const users = generateBatch(generateFakeUser, 50);
    expect(users).toHaveLength(50);
  });

  it("seeded random ayni seed ile ayni sonuc", () => {
    seedFakeData(123);
    const a = generateFakeUser();
    seedFakeData(123);
    const b = generateFakeUser();
    expect(a.email).toBe(b.email);
  });

  it("assertSandboxMode production'da throw eder", () => {
    expect(() => assertSandboxMode()).toThrow();
  });

  it("assertSandboxMode sandbox'ta gecer", () => {
    process.env.SANDBOX_MODE = "true";
    expect(() => assertSandboxMode()).not.toThrow();
    delete process.env.SANDBOX_MODE;
  });

  it("fake user'larda gercek PII yok", () => {
    for (let i = 0; i < 20; i++) {
      const u = generateFakeUser();
      // @sandbox.test domain disinda email uretilmemeli
      expect(u.email).toContain("@sandbox.test");
      // "Mock", "Sample", "Demo" gibi belirteclerden biri olmali (PII degil)
      const hasSyntheticMarker =
        u.name.includes("Test") ||
        u.name.includes("Demo") ||
        u.name.includes("Sample") ||
        u.name.includes("Mock") ||
        // Yoksa standart fake isimlerden biri
        ["Ahmet", "Ayşe", "Mehmet", "Fatma", "Ali", "Zeynep", "Mustafa", "Elif"].some(
          (n) => u.name.startsWith(n)
        );
      expect(hasSyntheticMarker).toBe(true);
    }
  });
});