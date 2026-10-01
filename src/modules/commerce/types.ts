/**
 * Commerce Module — Type Definitions
 */

export interface LicensePricingTier {
  id: string;
  days: number; // 0 = Süresiz / Ömür boyu, 30 = 30 gün, 60 = 60 gün vb.
  priceCents: number; // Kuruş cinsinden (örn: 1000 TL = 100000)
  label: string; // "30 Günlük", "60 Günlük", "1 Yıllık" vb.
  description?: string;
  isPopular?: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  priceCents: number;
  tierDays?: number;
  tierLabel?: string;
}

export interface CheckoutResult {
  url: string;
  sessionId: string;
}

export interface LicenseActivationInput {
  domain: string;
  ip: string;
}