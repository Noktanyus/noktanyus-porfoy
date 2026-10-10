import { describe, it, expect } from 'vitest';
import {
  detectCargoCarrier,
  calculateCargoDesi,
  buildCargoTrackingUrl,
  TURKISH_CARRIERS,
} from '../cargo';

describe('Turkish Cargo Suite', () => {
  describe('detectCargoCarrier', () => {
    it('detects Trendyol Express by TEX prefix', () => {
      const res = detectCargoCarrier('TEX1234567890');
      expect(res.detected).toBe(true);
      expect(res.primaryCarrier?.code).toBe('trendyol_express');
      expect(res.primaryCarrier?.trackingUrl).toContain('TEX1234567890');
    });

    it('detects HepsiJET by HJ prefix', () => {
      const res = detectCargoCarrier('HJ9988776655');
      expect(res.detected).toBe(true);
      expect(res.primaryCarrier?.code).toBe('hepsijet');
    });

    it('detects PTT Kargo by KP prefix with 13 chars', () => {
      const res = detectCargoCarrier('KP01234567890');
      expect(res.detected).toBe(true);
      expect(res.primaryCarrier?.code).toBe('ptt');
    });

    it('detects Sendeo by 2 prefix', () => {
      const res = detectCargoCarrier('212345678901');
      expect(res.detected).toBe(true);
      expect(res.primaryCarrier?.code).toBe('sendeo');
    });

    it('detects 12-digit numeric as Yurtiçi primary with Aras candidate', () => {
      const res = detectCargoCarrier('123456789012');
      expect(res.detected).toBe(true);
      expect(res.primaryCarrier?.code).toBe('yurtici');
      expect(res.candidates.some(c => c.code === 'aras')).toBe(true);
    });

    it('returns detected: false for empty or invalid input', () => {
      const res = detectCargoCarrier('');
      expect(res.detected).toBe(false);
      expect(res.primaryCarrier).toBeNull();
    });
  });

  describe('calculateCargoDesi', () => {
    it('calculates standard 3000 divisor desi correctly', () => {
      // 30cm * 20cm * 10cm = 6000 cm3 -> 6000 / 3000 = 2 desi
      const res = calculateCargoDesi({
        widthCm: 30,
        lengthCm: 20,
        heightCm: 10,
        weightKg: 1.5,
      });
      expect(res.volumeCm3).toBe(6000);
      expect(res.desi).toBe(2);
      expect(res.chargeableWeightKg).toBe(2);
      expect(res.pricingBasis).toBe('desi');
      expect(res.sizeCategoryKey).toBe('mico');
    });

    it('uses actual weight if heavier than desi', () => {
      // 20cm * 10cm * 15cm = 3000 cm3 -> 1 desi, but weight is 5 kg
      const res = calculateCargoDesi({
        widthCm: 20,
        lengthCm: 10,
        heightCm: 15,
        weightKg: 5,
      });
      expect(res.desi).toBe(1);
      expect(res.chargeableWeightKg).toBe(5);
      expect(res.pricingBasis).toBe('actual_weight');
    });

    it('supports 5000 international divisor', () => {
      const res = calculateCargoDesi({
        widthCm: 50,
        lengthCm: 50,
        heightCm: 20,
        divisor: 5000,
      });
      // 50000 / 5000 = 10 desi
      expect(res.desi).toBe(10);
      expect(res.divisorUsed).toBe(5000);
    });
  });

  describe('buildCargoTrackingUrl', () => {
    it('generates valid URL for valid carrier code', () => {
      const url = buildCargoTrackingUrl('yurtici', '123456789012');
      expect(url).toBe('https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=123456789012');
    });

    it('returns null for unknown carrier', () => {
      const url = buildCargoTrackingUrl('unknown_carrier', '123');
      expect(url).toBeNull();
    });
  });
});
