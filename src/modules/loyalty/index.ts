/**
 * Loyalty Module — Public exports.
 */

export { loyaltyService } from './service';
export {
  LOYALTY_TIERS,
  POINTS_RULES,
  getTierByPoints,
  getNextTier,
  normalizeTier,
  calculatePurchasePoints,
  getTierPerks,
  canAccessReward,
  type TierName,
  type PointsReason,
  type LoyaltyTier,
  type PointsRule,
} from './tiers';