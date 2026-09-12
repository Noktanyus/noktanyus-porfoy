/**
 * Plan features Zod schema — Sprint 1 typed limits.
 *
 * Backward compatible: eski `string[]` kayıtları otomatik `{ marketing: [...] }` formatına
 * dönüştürülür. Yeni kayıtlar `{ marketing, limits }` structured objesi olarak saklanır.
 *
 * - marketing: string[] — UI'da gösterilen özellik listesi
 * - limits.aiTokensPerMonth: number — Plan bazlı aylık AI token kotası
 * - limits.aiRequestsPerMonth: number — Plan bazlı aylık AI request kotası
 */

import { z } from 'zod';

export const PlanLimitsSchema = z.object({
  aiTokensPerMonth: z.number().int().nonnegative().optional(),
  aiRequestsPerMonth: z.number().int().nonnegative().optional(),
});
export type PlanLimits = z.infer<typeof PlanLimitsSchema>;

export const PlanFeaturesSchema = z.union([
  // Eski format: string[] → { marketing: [...] }
  z
    .array(z.string())
    .transform((arr) => ({ marketing: arr, limits: undefined as PlanLimits | undefined })),

  // Yeni format: { marketing, limits? }
  z.object({
    marketing: z.array(z.string()),
    limits: PlanLimitsSchema.optional(),
  }),
]);

export type PlanFeatures = z.infer<typeof PlanFeaturesSchema>;

/**
 * DB'den gelen Prisma JsonValue'yu güvenli parse eder.
 * Hata durumunda default (boş marketing listesi) döner.
 */
export function parsePlanFeatures(raw: unknown): PlanFeatures {
  const result = PlanFeaturesSchema.safeParse(raw);
  if (result.success) return result.data;
  return { marketing: [], limits: undefined };
}
