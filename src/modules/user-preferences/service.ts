/**
 * User Preferences Module — Service Layer
 *
 * Kullanicinin tema ve accent color tercihlerini yonetir.
 * - getPreferences: mevcut tercihi getirir (yoksa default degerlerle olusturur)
 * - updatePreferences: kismi guncelleme (partial update)
 */

import { prisma } from '@/lib/prisma';
import type { ThemeOption, AccentColor } from '@/lib/theme';
import { isAccentColor, isThemeOption } from '@/lib/theme';
import { logger } from '@/lib/logger';

const DEFAULTS: { theme: ThemeOption; accentColor: AccentColor } = {
  theme: 'system',
  accentColor: 'blue',
};

/**
 * Type guards — DB'den gelen string degerleri daraltmak icin.
 */
function coerceTheme(value: unknown): ThemeOption {
  return isThemeOption(value) ? value : DEFAULTS.theme;
}
function coerceAccent(value: unknown): AccentColor {
  return isAccentColor(value) ? value : DEFAULTS.accentColor;
}

/**
 * Service public API. Sade-tarz object uzerinden fonksiyonlar.
 */
export const userPreferencesService = {
  /**
   * Kullanicinin tercihlerini getir. Kayit yoksa default degerlerle
   * implicit bir kayit olusturur (kullanici ilk acilisinda DB satir yazilir).
   */
  async getPreferences(userId: string): Promise<{ theme: ThemeOption; accentColor: AccentColor }> {
    const row = await prisma.themePreference.findUnique({
      where: { userId },
      select: { theme: true, accentColor: true },
    });

    if (row) {
      return {
        theme: coerceTheme(row.theme),
        accentColor: coerceAccent(row.accentColor),
      };
    }

    // Implicit create — kullaniciya gormeden bir satir yazip tekrar donmek
    // yerine, ilk PATCH'te upsert yapiyoruz. Burada default'lar donulur.
    return { ...DEFAULTS };
  },

  /**
   * Tercihleri kismi olarak guncelle. En az bir alan gelmeli (schema seviyesinde kontrol).
   * upsert: ilk kez yaziliyorsa create, varsa update.
   */
  async updatePreferences(
    userId: string,
    input: { theme?: ThemeOption; accentColor?: AccentColor }
  ): Promise<{ theme: ThemeOption; accentColor: AccentColor }> {
    const data: Record<string, string> = {};
    if (input.theme !== undefined) data.theme = input.theme;
    if (input.accentColor !== undefined) data.accentColor = input.accentColor;

    const updated = await prisma.themePreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        theme: input.theme ?? DEFAULTS.theme,
        accentColor: input.accentColor ?? DEFAULTS.accentColor,
      },
      select: { theme: true, accentColor: true },
    });

    logger.info('User preferences updated', {
      userId,
      fields: Object.keys(data),
    });

    return {
      theme: coerceTheme(updated.theme),
      accentColor: coerceAccent(updated.accentColor),
    };
  },
};