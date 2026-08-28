/**
 * Loyalty Tiers & Points Rules
 *
 * Bronze / Silver / Gold / Platinum tier sistemi.
 * Tier, lifetimePoints bazli hesaplanir (asagi dusmez — sadece yukari).
 */

export type TierName = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LoyaltyTier {
  name: TierName;
  label: string;
  threshold: number; // minimum lifetimePoints
  perks: string[];
  discountPercent: number;
  color: string; // gradient start
  gradient: string; // Tailwind gradient class
}

/**
 * Tier tanimlari — sirayla threshold artar.
 * Platinum en ust, Bronze default.
 */
export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    name: 'bronze',
    label: 'Bronze',
    threshold: 0,
    perks: ['Hosgeldin bonusu', 'Temel puan kazanma'],
    discountPercent: 0,
    color: '#CD7F32',
    gradient: 'from-amber-600 to-orange-700',
  },
  {
    name: 'silver',
    label: 'Silver',
    threshold: 1000,
    perks: ['%5 indirim', 'Ayin urununde ekstra puan'],
    discountPercent: 5,
    color: '#C0C0C0',
    gradient: 'from-slate-400 to-slate-600',
  },
  {
    name: 'gold',
    label: 'Gold',
    threshold: 5000,
    perks: ['%10 indirim', 'Ucretsiz kargo', 'Erken erisim kampanyalari'],
    discountPercent: 10,
    color: '#FFD700',
    gradient: 'from-yellow-400 to-amber-500',
  },
  {
    name: 'platinum',
    label: 'Platinum',
    threshold: 15000,
    perks: ['%15 indirim', 'Oncelikli destek', 'VIP etkinlikler', 'Ozel puan 2x kampanyalari'],
    discountPercent: 15,
    color: '#E5E4E2',
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
  },
];

/**
 * Lifetime points'a gore uygun tier'i bul.
 * Threshold >= lifetimePoints olan EN YUKSEK tier.
 */
export function getTierByPoints(lifetimePoints: number): LoyaltyTier {
  // Sondan basa git — ilk eslesen tier (en yuksek) return et
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (lifetimePoints >= LOYALTY_TIERS[i].threshold) {
      return LOYALTY_TIERS[i];
    }
  }
  return LOYALTY_TIERS[0]; // Fallback — bronze
}

/**
 * Bir sonraki tier — null ise en ustteki.
 */
export function getNextTier(currentTier: TierName): LoyaltyTier | null {
  const idx = LOYALTY_TIERS.findIndex((t) => t.name === currentTier);
  if (idx === -1 || idx === LOYALTY_TIERS.length - 1) return null;
  return LOYALTY_TIERS[idx + 1];
}

/**
 * Tier string degerini TierName'e coerce et.
 * Bilinmeyen deger icin bronze fallback.
 */
export function normalizeTier(tier: string | null | undefined): TierName {
  const found = LOYALTY_TIERS.find((t) => t.name === tier);
  return (found?.name ?? 'bronze') as TierName;
}

/**
 * Tier perks'leri getir (TierName ile).
 */
export function getTierPerks(tier: TierName): string[] {
  const t = LOYALTY_TIERS.find((x) => x.name === tier);
  return t?.perks ?? [];
}

// =========================================================================
// POINTS RULES
// =========================================================================

export type PointsReason =
  | 'purchase'
  | 'review'
  | 'referral'
  | 'signup'
  | 'birthday'
  | 'redemption'
  | 'adjustment';

export interface PointsRule {
  reason: PointsReason;
  amount: number; // Pozitif = kazanilan, Negatif = harcanan
  description: string;
}

export const POINTS_RULES: Record<PointsReason, PointsRule> = {
  purchase: {
    reason: 'purchase',
    amount: 1, // Her 1 TL = 1 puan
    description: 'Her 1 TL harcama icin 1 puan',
  },
  review: {
    reason: 'review',
    amount: 50,
    description: 'Urun yorumu icin 50 puan',
  },
  referral: {
    reason: 'referral',
    amount: 200,
    description: 'Basarili davet icin 200 puan',
  },
  signup: {
    reason: 'signup',
    amount: 100,
    description: 'Yeni uye bonusu 100 puan',
  },
  birthday: {
    reason: 'birthday',
    amount: 500,
    description: 'Dogum gunu bonusu 500 puan',
  },
  redemption: {
    reason: 'redemption',
    amount: 0, // Ozel hesaplanir
    description: 'Odul kullanildi',
  },
  adjustment: {
    reason: 'adjustment',
    amount: 0, // Manuel adjustment
    description: 'Manuel duzeltme',
  },
};

/**
 * Purchase'tan kazanilan puan (tutar bazli).
 * totalCents'i TL'ye cevirip POINTS_RULES.purchase.amount ile carpar.
 */
export function calculatePurchasePoints(totalCents: number): number {
  const tlAmount = Math.floor(totalCents / 100); // Cent -> TL
  return Math.max(0, tlAmount * POINTS_RULES.purchase.amount);
}

/**
 * Tier'in minimum tier gereksinimi karsilanir mi kontrol et.
 */
export function canAccessReward(rewardTier: string, userTier: TierName): boolean {
  const required = LOYALTY_TIERS.find((t) => t.name === rewardTier);
  if (!required) return true; // Bilinmeyen tier = acik
  const userIdx = LOYALTY_TIERS.findIndex((t) => t.name === userTier);
  const requiredIdx = LOYALTY_TIERS.findIndex((t) => t.name === required.name);
  return userIdx >= requiredIdx;
}