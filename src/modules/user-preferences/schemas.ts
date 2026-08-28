/**
 * User Preferences Module — Zod Schemas
 *
 * Kullanici tema ve accent color tercihleri icin input validation.
 */

import { z } from 'zod';
import { ACCENT_COLORS, THEME_OPTIONS, type AccentColor, type ThemeOption } from '@/lib/theme';

export const ThemeEnum = z.enum(
  THEME_OPTIONS.map((o) => o.value) as [ThemeOption, ...ThemeOption[]]
);

export const AccentEnum = z.enum(
  ACCENT_COLORS.map((c) => c.value) as [AccentColor, ...AccentColor[]]
);

/**
 * PATCH /api/user/preferences icin body semasi.
 * Her iki alan da opsiyonel — en az birinin gelmesi beklenir.
 */
export const UpdatePreferencesSchema = z
  .object({
    theme: ThemeEnum.optional(),
    accentColor: AccentEnum.optional(),
  })
  .refine((data) => data.theme !== undefined || data.accentColor !== undefined, {
    message: 'En az bir tercih alani gonderilmeli (theme veya accentColor)',
  });

export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;