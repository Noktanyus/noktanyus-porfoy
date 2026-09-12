/**
 * @file Theme Preference Service
 * @description Kullanıcının aktif tema preset'ini DB'de saklar ve yükler.
 *              Schema: ThemePreference (userId @unique, theme, accentColor, updatedAt).
 *
 *              NOT: Schema'da ayrı bir `presetId` alanı yok; preset kimliği
 *              `theme` alanında ("default" | "ocean" | "sunset" | "forest"
 *              | "rose" | "midnight") string olarak saklanır.
 */

import { prisma } from "@/lib/prisma";
import type { ThemePresetId } from "./presets";
import { isThemePresetId } from "./presets";

export interface UserThemePreference {
  userId: string;
  presetId: ThemePresetId;
  updatedAt: Date;
}

/**
 * DB'de saklanan alan (theme) ile uygulama tarafındaki presetId arasında
 * adapter. Bu sayede service hâlâ `presetId` API'sini kullanır; DB katmanında
 * schema uyumu için `theme` alanına map'lenir.
 */
function themeToPresetId(theme: string | null | undefined): ThemePresetId {
  if (theme && isThemePresetId(theme)) return theme;
  return "default";
}

export const userThemeService = {
  /**
   * Kullanıcının tema tercihini getirir. Yoksa default döner.
   */
  async getPreference(userId: string): Promise<ThemePresetId> {
    try {
      const pref = await prisma.themePreference.findUnique({
        where: { userId },
        select: { theme: true },
      });
      if (pref) return themeToPresetId(pref.theme);
    } catch (err) {
      // DB erişimi yoksa default'a düş
    }
    return "default";
  },

  /**
   * Kullanıcının tema tercihini kaydeder (upsert).
   */
  async setPreference(userId: string, presetId: ThemePresetId): Promise<UserThemePreference | null> {
    const pref = await prisma.themePreference.upsert({
      where: { userId },
      create: { userId, theme: presetId },
      update: { theme: presetId },
    });
    return {
      userId: pref.userId,
      presetId: themeToPresetId(pref.theme),
      updatedAt: pref.updatedAt,
    };
  },

  /**
   * Kullanıcının tema tercihini siler (default'a düşer).
   */
  async clearPreference(userId: string): Promise<void> {
    await prisma.themePreference.delete({
      where: { userId },
    });
  },
};