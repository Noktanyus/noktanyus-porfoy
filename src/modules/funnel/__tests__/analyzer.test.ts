/**
 * @file Funnel analyzer tests
 * @description G2: analyzeFunnel, stepDropoffPercent, generateInsights testleri.
 */

import { describe, it, expect } from "vitest";
import { analyzeFunnel, stepDropoffPercent, generateInsights } from "../analyzer";
import { DEFAULT_FUNNEL, type FunnelEvent, type FunnelStep } from "../schemas";

function evt(name: string, userId: string, ts = 0): FunnelEvent {
  return { name, userId, sessionId: `s-${userId}`, timestamp: ts || Math.random() * 1e10 };
}

describe("Funnel Analyzer", () => {
  it("bos event listesi 0/0 rapor uretir", () => {
    const report = analyzeFunnel([], DEFAULT_FUNNEL);
    expect(report.totalEntered).toBe(0);
    expect(report.totalCompleted).toBe(0);
    expect(report.overallConversion).toBe(0);
  });

  it("tek kullanicinin tam yolculugu %100 conversion", () => {
    const events = [
      evt("visit", "u1"),
      evt("signup_complete", "u1"),
      evt("checkout_start", "u1"),
      evt("paid", "u1"),
    ];
    const report = analyzeFunnel(events, DEFAULT_FUNNEL);
    expect(report.totalEntered).toBe(1);
    expect(report.totalCompleted).toBe(1);
    expect(report.overallConversion).toBe(100);
  });

  it("drop-off conversion oranini dusurur", () => {
    const events = [
      // 4 user ziyaret etti
      evt("visit", "u1"),
      evt("visit", "u2"),
      evt("visit", "u3"),
      evt("visit", "u4"),
      // 2 signup yapti
      evt("signup_complete", "u1"),
      evt("signup_complete", "u2"),
      // 1 checkout baslatti
      evt("checkout_start", "u1"),
      // 0 paid
    ];
    const report = analyzeFunnel(events, DEFAULT_FUNNEL);

    expect(report.totalEntered).toBe(4);
    expect(report.steps[0].reached).toBe(4);
    expect(report.steps[1].reached).toBe(2);
    expect(report.steps[1].conversionRate).toBe(50);
    expect(report.steps[2].reached).toBe(1);
    expect(report.steps[2].conversionRate).toBe(50);
    expect(report.totalCompleted).toBe(0);
    expect(report.overallConversion).toBe(0);
  });

  it("her step'te dropped sayisi hesaplanir", () => {
    const events = [
      evt("visit", "u1"),
      evt("visit", "u2"),
      evt("visit", "u3"),
      evt("visit", "u4"),
      evt("signup_complete", "u1"),
      evt("signup_complete", "u2"),
    ];
    const report = analyzeFunnel(events, DEFAULT_FUNNEL);
    expect(report.steps[1].dropped).toBe(2); // 4'ten 2'si signup yapti
    expect(report.steps[0].dropped).toBe(0); // ilk step'te drop hesaplanmaz
  });

  it("biggestDropoff en kotu step'i isaret eder", () => {
    const events = [
      evt("visit", "u1"),
      evt("visit", "u2"),
      evt("visit", "u3"),
      evt("visit", "u4"),
      evt("visit", "u5"),
      evt("signup_complete", "u1"), // 5'ten 1'e = %80 drop
      // checkout'a kimse gelmedi — %100 drop (en kotu)
    ];
    const report = analyzeFunnel(events, DEFAULT_FUNNEL);
    expect(report.biggestDropoff).not.toBeNull();
    // checkout 1 → 0 = %100 dropoff, signup 5 → 1 = %80 dropoff
    expect(report.biggestDropoff?.stepId).toBe("checkout");
    expect(report.biggestDropoff?.dropoffPercent).toBe(100);
  });

  it("zaman araligi filtresi calisir", () => {
    const events = [
      { ...evt("visit", "u1"), timestamp: 1000 },
      { ...evt("visit", "u2"), timestamp: 5000 },
      { ...evt("visit", "u3"), timestamp: 9000 },
    ];
    const report = analyzeFunnel(events, DEFAULT_FUNNEL, {
      rangeStart: 2000,
      rangeEnd: 8000,
    });
    expect(report.totalEntered).toBe(1); // sadece u2
  });

  it("cumulative oranlar ilk step'i 100 kabul eder", () => {
    const events = [
      evt("visit", "u1"),
      evt("visit", "u2"),
      evt("signup_complete", "u1"),
    ];
    const report = analyzeFunnel(events, DEFAULT_FUNNEL);
    expect(report.steps[0].cumulativeRate).toBe(100);
    expect(report.steps[1].cumulativeRate).toBe(50);
  });

  it("unique identifier sessionId fallback'i calisir", () => {
    const events: FunnelEvent[] = [
      { name: "visit", userId: null, sessionId: "anon-1", timestamp: 1 },
      { name: "visit", userId: null, sessionId: "anon-1", timestamp: 2 },
      { name: "visit", userId: null, sessionId: "anon-2", timestamp: 3 },
    ];
    const report = analyzeFunnel(events, DEFAULT_FUNNEL);
    expect(report.totalEntered).toBe(2); // 2 unique anon session
  });

  it("custom funnel ile calisir", () => {
    const custom: FunnelStep[] = [
      { id: "view", name: "Goruntule", eventName: "view" },
      { id: "click", name: "Tikla", eventName: "click" },
    ];
    const events = [
      evt("view", "u1"),
      evt("view", "u2"),
      evt("click", "u1"),
    ];
    const report = analyzeFunnel(events, custom);
    expect(report.steps).toHaveLength(2);
    expect(report.steps[1].conversionRate).toBe(50);
  });

  it("stepDropoffPercent dogru hesaplar", () => {
    const events = [
      evt("visit", "u1"),
      evt("visit", "u2"),
      evt("signup_complete", "u1"),
    ];
    const report = analyzeFunnel(events, DEFAULT_FUNNEL);
    expect(stepDropoffPercent(report, "signup")).toBe(50);
    expect(stepDropoffPercent(report, "checkout")).toBe(100); // hic gelmedi
  });

  it("stepDropoffPercent var olmayan step icin 0", () => {
    const report = analyzeFunnel([], DEFAULT_FUNNEL);
    expect(stepDropoffPercent(report, "yok")).toBe(0);
  });

  it("generateInsights yuksek drop-off warning uretir", () => {
    const events = [
      evt("visit", "u1"),
      evt("visit", "u2"),
      evt("visit", "u3"),
      evt("visit", "u4"),
      evt("visit", "u5"),
      evt("signup_complete", "u1"), // sadece 1/5
    ];
    const report = analyzeFunnel(events, DEFAULT_FUNNEL);
    const insights = generateInsights(report);
    const warning = insights.find((i) => i.type === "warning");
    expect(warning).toBeDefined();
    expect(warning?.stepId).toBe("signup");
  });

  it("generateInsights iyi conversion success uretir", () => {
    const events = [
      evt("visit", "u1"),
      evt("visit", "u2"),
      evt("visit", "u3"),
      evt("visit", "u4"),
      evt("visit", "u5"),
      evt("signup_complete", "u1"),
      evt("signup_complete", "u2"),
      evt("signup_complete", "u3"),
      evt("signup_complete", "u4"),
    ];
    const report = analyzeFunnel(events, DEFAULT_FUNNEL);
    const insights = generateInsights(report);
    const success = insights.find((i) => i.type === "success");
    expect(success).toBeDefined();
  });

  it("ilk step icin insight uretilmez", () => {
    const events = [evt("visit", "u1")];
    const report = analyzeFunnel(events, DEFAULT_FUNNEL);
    const insights = generateInsights(report);
    expect(insights).toHaveLength(0);
  });
});