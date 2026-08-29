/**
 * @file Theme Preference Service
 * @description Kullanıcının aktif tema preset'ini DB'de saklar ve yükler.
 *              Schema: ThemePreference (User.id PK, presetId, updatedAt).
 */

import { prisma } from "@/lib/prisma";
import type { ThemePresetId } from "./presets";
import { isThemePresetId } from "./presets";

export interface UserThemePreference {
  userId: string;
  presetId: ThemePresetId;
  updatedAt: Date;
}

export const userThemeService = {
  /**
   * Kullanıcının tema tercihini getirir. Yoksa default döner.
   */
  async getPreference(userId: string): Promise<ThemePresetId> {
    try {
      const pref = await prisma.themePreference.findUnique({
        where: { userId },
        select: { presetId: true },
      });
      if (pref && isThemePresetId(pref.presetId)) return pref.presetId;
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
      create: { userId, presetId },
      update: { presetId },
    });
    return {
      userId: pref.userId,
      presetId: isThemePresetId(pref.presetId) ? pref.presetId : "default",
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