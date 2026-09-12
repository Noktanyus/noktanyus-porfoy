/**
 * @file Branding Service
 * @description Workspace branding ayarlarını DB'de yönetir.
 *              Schema: Workspace üzerinde brandColor, brandLogo, brandFavicon,
 *              customDomain, whiteLabelEnabled alanları tutulur.
 *              (Ayrı bir WorkspaceBranding modeli yok; Workspace modeli
 *              içinde inline saklanıyor — Sprint 1 prod-hardening.)
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

/**
 * Workspace'in brand alanlarını BrandingConfig'e dönüştürür.
 * brandColor varsayılanı "blue" olur; fontFamily/sosyal linkler gibi
 * zengin alanlar schema'da tutulmadığı için DEFAULT değerlere düşer.
 */
function workspaceToBranding(ws: {
  id: string;
  brandColor: string;
  brandLogo: string | null;
  brandFavicon: string | null;
  customDomain: string | null;
  whiteLabelEnabled: boolean;
  updatedAt: Date;
}): BrandingConfig {
  return {
    workspaceId: ws.id,
    logoUrl: ws.brandLogo,
    faviconUrl: ws.brandFavicon,
    primaryColor: ws.brandColor ?? DEFAULT_BRANDING.primaryColor,
    accentColor: DEFAULT_BRANDING.accentColor,
    fontFamily: DEFAULT_BRANDING.fontFamily,
    customCss: null,
    tagline: null,
    socialLinks: {},
    updatedAt: ws.updatedAt,
  };
}

export const brandingService = {
  /**
   * Workspace branding ayarlarını getir. Yoksa default ile oluştur.
   */
  async getOrCreate(workspaceId: string): Promise<BrandingConfig> {
    const existing = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        brandColor: true,
        brandLogo: true,
        brandFavicon: true,
        customDomain: true,
        whiteLabelEnabled: true,
        updatedAt: true,
      },
    });

    if (existing) {
      return workspaceToBranding(existing);
    }

    // Workspace bulunamadı — boş default dön. (create yok çünkü workspace
    // oluşturma bu service'in sorumluluğu dışında.)
    return {
      workspaceId,
      ...DEFAULT_BRANDING,
      updatedAt: new Date(),
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

    // primaryColor → brandColor, logoUrl → brandLogo, vb. map
    const data: Record<string, unknown> = {};
    if (input.primaryColor !== undefined) data.brandColor = input.primaryColor;
    if (input.logoUrl !== undefined) data.brandLogo = input.logoUrl;
    if (input.faviconUrl !== undefined) data.brandFavicon = input.faviconUrl;

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data,
      select: {
        id: true,
        brandColor: true,
        brandLogo: true,
        brandFavicon: true,
        customDomain: true,
        whiteLabelEnabled: true,
        updatedAt: true,
      },
    });

    return workspaceToBranding(updated);
  },

  /**
   * Default değerlere sıfırla.
   */
  async reset(workspaceId: string): Promise<BrandingConfig> {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        brandColor: "blue",
        brandLogo: null,
        brandFavicon: null,
      },
    });
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