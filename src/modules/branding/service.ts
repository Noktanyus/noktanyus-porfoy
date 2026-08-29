/**
 * @file Branding Service
 * @description Workspace branding ayarlarını DB'de yönetir.
 *              Schema: WorkspaceBranding (workspaceId PK, alanlar).
 */

import { prisma } from "@/lib/prisma";
import {
  type BrandingConfig,
  DEFAULT_BRANDING,
  type FontFamily,
  isFontFamily,
  isValidHexColor,
} from "./schemas";

type UpdateInput = Partial<{
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  fontFamily: FontFamily;
  customCss: string | null;
  tagline: string | null;
  socialLinks: BrandingConfig["socialLinks"];
}>;

export const brandingService = {
  /**
   * Workspace branding ayarlarını getir. Yoksa default ile oluştur.
   */
  async getOrCreate(workspaceId: string): Promise<BrandingConfig> {
    const existing = await prisma.workspaceBranding.findUnique({
      where: { workspaceId },
    });

    if (existing) {
      return {
        workspaceId: existing.workspaceId,
        logoUrl: existing.logoUrl,
        faviconUrl: existing.faviconUrl,
        primaryColor: existing.primaryColor,
        accentColor: existing.accentColor,
        fontFamily: isFontFamily(existing.fontFamily) ? existing.fontFamily : "inter",
        customCss: existing.customCss,
        tagline: existing.tagline,
        socialLinks: (existing.socialLinks as BrandingConfig["socialLinks"]) ?? {},
        updatedAt: existing.updatedAt,
      };
    }

    const created = await prisma.workspaceBranding.create({
      data: {
        workspaceId,
        ...DEFAULT_BRANDING,
      },
    });

    return {
      workspaceId,
      ...DEFAULT_BRANDING,
      updatedAt: created.updatedAt,
    };
  },

  /**
   * Branding ayarlarını güncelle. Validasyon yapar.
   */
  async update(workspaceId: string, input: UpdateInput): Promise<BrandingConfig> {
    // Validasyon
    if (input.primaryColor !== undefined && !isValidHexColor(input.primaryColor)) {
      throw new Error("primaryColor must be a valid hex color");
    }
    if (input.accentColor !== undefined && !isValidHexColor(input.accentColor)) {
      throw new Error("accentColor must be a valid hex color");
    }
    if (input.fontFamily !== undefined && !isFontFamily(input.fontFamily)) {
      throw new Error("fontFamily must be a valid font");
    }

    // Önce kayıt yoksa oluştur
    await this.getOrCreate(workspaceId);

    const updated = await prisma.workspaceBranding.update({
      where: { workspaceId },
      data: input,
    });

    return {
      workspaceId: updated.workspaceId,
      logoUrl: updated.logoUrl,
      faviconUrl: updated.faviconUrl,
      primaryColor: updated.primaryColor,
      accentColor: updated.accentColor,
      fontFamily: isFontFamily(updated.fontFamily) ? updated.fontFamily : "inter",
      customCss: updated.customCss,
      tagline: updated.tagline,
      socialLinks: (updated.socialLinks as BrandingConfig["socialLinks"]) ?? {},
      updatedAt: updated.updatedAt,
    };
  },

  /**
   * Default değerlere sıfırla.
   */
  async reset(workspaceId: string): Promise<BrandingConfig> {
    await prisma.workspaceBranding.deleteMany({ where: { workspaceId } });
    return this.getOrCreate(workspaceId);
  },

  /**
   * CSS değişkeni olarak dışa aktar.
   * Layout'ta inline style olarak uygulanır.
   */
  async exportCssVariables(workspaceId: string): Promise<string> {
    const cfg = await this.getOrCreate(workspaceId);
    const font = (await import("./schemas")).getFontByValue(cfg.fontFamily);

    const vars: Record<string, string> = {
      "--brand-primary-color": cfg.primaryColor,
      "--brand-accent-color": cfg.accentColor,
      "--brand-font-family": font?.cssValue ?? "system-ui",
    };

    if (cfg.customCss) {
      // Custom CSS ayrı return edilir (güvenlik için sanitize gerekli)
    }

    return Object.entries(vars)
      .map(([k, v]) => `${k}: ${v};`)
      .join(" ");
  },
};