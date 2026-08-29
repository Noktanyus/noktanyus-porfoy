/**
 * @file Revenue metrics tests
 * @description G1: MRR/ARR/Churn/LTV/ARPU pure-function testleri.
 */

import { describe, it, expect } from "vitest";
import {
  calcMRR,
  calcARR,
  calcChurnRate,
  calcARPU,
  calcLTV,
  computeMetrics,
  formatCurrency,
  formatPercent,
  trendPercent,
  trendDirection,
  type RevenueInputs,
} from "../metrics";

const sampleInput: RevenueInputs = {
  monthlyRecurringRevenue: 10000,
  churnedThisMonth: 5,
  activeAtStartOfMonth: 100,
  totalCustomers: 100,
  averageLifetimeMonths: 12,
};

describe("Revenue Metrics", () => {
  it("MRR = input.monthlyRecurringRevenue", () => {
    expect(calcMRR(sampleInput)).toBe(10000);
  });

  it("ARR = MRR × 12", () => {
    expect(calcARR(sampleInput)).toBe(120000);
  });

  it("Churn Rate = (5/100) × 100 = 5%", () => {
    expect(calcChurnRate(sampleInput)).toBe(5);
  });

  it("Churn Rate: 0'a bolunme korumasi", () => {
    expect(calcChurnRate({ ...sampleInput, activeAtStartOfMonth: 0 })).toBe(0);
  });

  it("ARPU = MRR / totalCustomers", () => {
    expect(calcARPU(sampleInput)).toBe(100); // 10000 / 100
  });

  it("ARPU: 0 customer = 0", () => {
    expect(calcARPU({ ...sampleInput, totalCustomers: 0 })).toBe(0);
  });

  it("LTV churn varsa = ARPU / (churn/100)", () => {
    const result = calcLTV(sampleInput);
    expect(result.value).toBe(2000);
    expect(result.method).toBe("conventional");
  });

  it("LTV churn 0 ise = ARPU × averageLifetime", () => {
    const noChurn = { ...sampleInput, churnedThisMonth: 0 };
    const result = calcLTV(noChurn);
    expect(result.value).toBe(1200);
    expect(result.method).toBe("historical");
  });

  it("computeMetrics tum alanlari doner", () => {
    const m = computeMetrics(sampleInput);
    expect(m).toHaveProperty("mrr");
    expect(m).toHaveProperty("arr");
    expect(m).toHaveProperty("churnRate");
    expect(m).toHaveProperty("ltv");
    expect(m).toHaveProperty("arpu");
    expect(m.mrr).toBe(10000);
    expect(m.arr).toBe(120000);
  });

  it("formatCurrency USD formatinda", () => {
    const formatted = formatCurrency(1234.5);
    expect(formatted).toContain("1,234");
    expect(formatted).toContain("$");
  });

  it("formatCurrency EUR destegi", () => {
    const formatted = formatCurrency(1000, "EUR");
    expect(formatted).toContain("€");
  });

  it("formatPercent yuzde isareti ile", () => {
    expect(formatPercent(5.234)).toBe("5.23%");
    expect(formatPercent(0, 0)).toBe("0%");
  });

  it("trendPercent pozitif buyume", () => {
    expect(trendPercent(120, 100)).toBe(20);
  });

  it("trendPercent negatif dusus", () => {
    expect(trendPercent(80, 100)).toBe(-20);
  });

  it("trendPercent sifir bolunme korumasi", () => {
    expect(trendPercent(100, 0)).toBe(100);
    expect(trendPercent(0, 0)).toBe(0);
  });

  it("trendDirection threshold'a gore calisir", () => {
    expect(trendDirection(5)).toBe("up");
    expect(trendDirection(-5)).toBe("down");
    expect(trendDirection(0.3)).toBe("flat");
    expect(trendDirection(0.3, 0.1)).toBe("up");
  });

  it("yüksek MRR doğru hesaplanır", () => {
    const big = {
      ...sampleInput,
      monthlyRecurringRevenue: 1_000_000,
      totalCustomers: 5000,
    };
    const m = computeMetrics(big);
    expect(m.mrr).toBe(1_000_000);
    expect(m.arr).toBe(12_000_000);
    expect(m.arpu).toBe(200); // 1M / 5K
  });

  it("düşük churn ile yüksek LTV", () => {
    const sticky = {
      ...sampleInput,
      churnedThisMonth: 1,
      activeAtStartOfMonth: 100,
    };
    const result = calcLTV(sticky);
    expect(result.value).toBe(10000); // 100 / 0.01 = 10000
    expect(result.method).toBe("conventional");
  });

  it("LTV %100 churn → historical fallback", () => {
    const fullChurn = {
      ...sampleInput,
      churnedThisMonth: 100,
      activeAtStartOfMonth: 100,
    };
    const result = calcLTV(fullChurn);
    expect(result.method).toBe("historical");
    expect(result.value).toBe(1200); // 100 * 12
  });

  it("LTV hiç veri yok → fallback 0", () => {
    const empty = {
      monthlyRecurringRevenue: 0,
      churnedThisMonth: 0,
      activeAtStartOfMonth: 0,
      totalCustomers: 0,
      averageLifetimeMonths: 0,
    };
    const result = calcLTV(empty);
    expect(result.method).toBe("fallback");
    expect(result.value).toBe(0);
  });

  it("LTV breakdown inputs metadata icerir", () => {
    const result = calcLTV(sampleInput);
    expect(result.inputs.arpu).toBe(100);
    expect(result.inputs.monthlyChurnRate).toBe(5);
  });
});