import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";

describe("Auth utilities", () => {
  it("hashes and verifies passwords correctly", async () => {
    const password = "testPassword123";
    const hash = await bcrypt.hash(password, 12);
    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2")).toBe(true); // bcrypt prefix
    expect(await bcrypt.compare(password, hash)).toBe(true);
    expect(await bcrypt.compare("wrong", hash)).toBe(false);
  });

  it("generates different hashes for the same password (salt)", async () => {
    const password = "testPassword123";
    const hash1 = await bcrypt.hash(password, 12);
    const hash2 = await bcrypt.hash(password, 12);
    expect(hash1).not.toBe(hash2);
    // İkisi de aynı şifreyi doğrulamalı
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });

  it("rejects empty passwords", async () => {
    const password = "validPassword123";
    const hash = await bcrypt.hash(password, 12);
    expect(await bcrypt.compare("", hash)).toBe(false);
  });

  it("password hashing is reasonably fast (security vs perf)", async () => {
    const start = Date.now();
    await bcrypt.hash("testPassword123", 12);
    const duration = Date.now() - start;
    // 12 round en az 100ms sürmeli (brute-force koruması)
    expect(duration).toBeGreaterThanOrEqual(50);
    // Çok da yavaş olmamalı (UX)
    expect(duration).toBeLessThan(5000);
  });
});
