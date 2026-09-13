/**
 * Plan features Zod schema — API istek kotası.
 *
 * Backward compatible: eski string[] → { marketing }.
 * Eski aiTokensPerMonth alanları yok sayılır; apiRequestsPerMonth kullanılır.
 */

import { z } from 'zod';

export const PlanLimitsSchema = z.object({
  apiRequestsPerMonth: z.number().int().nonnegative().optional(),
  /** @deprecated AI ürünü kaldırıldı; parse için tutuluyor */
  aiTokensPerMonth: z.number().int().nonnegative().optional(),
  /** @deprecated AI ürünü kaldırıldı; apiRequestsPerMonth tercih edilir */
  aiRequestsPerMonth: z.number().int().nonnegative().optional(),
});
export type PlanLimits = z.infer<typeof PlanLimitsSchema>;

export const PlanFeaturesSchema = z.union([
  z
    .array(z.string())
    .transform((arr) => ({ marketing: arr, limits: undefined as PlanLimits | undefined })),

  z.object({
    marketing: z.array(z.string()),
    limits: PlanLimitsSchema.optional(),
  }),
]);

export type PlanFeatures = z.infer<typeof PlanFeaturesSchema>;

export function parsePlanFeatures(raw: unknown): PlanFeatures {
  const result = PlanFeaturesSchema.safeParse(raw);
  if (result.success) {
    const data = result.data;
    if (data.limits) {
      const api =
        data.limits.apiRequestsPerMonth ?? data.limits.aiRequestsPerMonth;
      return {
        marketing: data.marketing,
        limits: api !== undefined ? { apiRequestsPerMonth: api } : data.limits,
      };
    }
    return data;
  }
  return { marketing: [], limits: undefined };
}

/** Plan limitinden etkili aylık API istek kotasını çıkarır. */
export function effectiveApiRequestLimit(limits: PlanLimits | null | undefined): number | undefined {
  if (!limits) return undefined;
  return limits.apiRequestsPerMonth ?? limits.aiRequestsPerMonth;
}
