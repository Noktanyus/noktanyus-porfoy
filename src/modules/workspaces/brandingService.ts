/**
 * @file brandingService — Workspace beyaz etiket / marka servis katmanı.
 * @description
 *   Workspace sahibinin brandColor, brandLogo, brandFavicon, customDomain ve
 *   whiteLabelEnabled alanlarını yönetir. Üretilen CSS değişkeni (--brand-primary)
 *   client-side BrandingProvider üzerinden document root'a uygulanır.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const BRAND_COLOR_PRESETS: Record<string, string> = {
  blue: '#0078D4',
  emerald: '#10b981',
  violet: '#8b5cf6',
  rose: '#f43f5e',
  amber: '#f59e0b',
  indigo: '#6366f1',
  slate: '#475569',
  red: '#ef4444',
};

export const DEFAULT_BRAND_COLOR = 'blue';

export interface WorkspaceBranding {
  workspaceId: string;
  brandColor: string;
  brandLogo: string | null;
  brandFavicon: string | null;
  customDomain: string | null;
  whiteLabelEnabled: boolean;
}

export interface UpdateBrandingInput {
  brandColor?: string;
  brandLogo?: string | null;
  brandFavicon?: string | null;
  customDomain?: string | null;
  whiteLabelEnabled?: boolean;
}

export const brandingService = {
  /**
   * Workspace branding bilgisini getir. Bulamazsa default döner.
   */
  async getBranding(workspaceId: string): Promise<WorkspaceBranding> {
    const ws = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        brandColor: true,
        brandLogo: true,
        brandFavicon: true,
        customDomain: true,
        whiteLabelEnabled: true,
      },
    });
    if (!ws) {
      return {
        workspaceId,
        brandColor: DEFAULT_BRAND_COLOR,
        brandLogo: null,
        brandFavicon: null,
        customDomain: null,
        whiteLabelEnabled: false,
      };
    }
    return {
      workspaceId: ws.id,
      brandColor: ws.brandColor ?? DEFAULT_BRAND_COLOR,
      brandLogo: ws.brandLogo ?? null,
      brandFavicon: ws.brandFavicon ?? null,
      customDomain: ws.customDomain ?? null,
      whiteLabelEnabled: Boolean(ws.whiteLabelEnabled),
    };
  },

  /**
   * Branding alanlarını günceller. Boş string olanları null'a normalize eder.
   */
  async updateBranding(
    workspaceId: string,
    input: UpdateBrandingInput
  ): Promise<WorkspaceBranding> {
    const data: Record<string, unknown> = {};
    if (typeof input.brandColor === 'string') {
      data.brandColor = input.brandColor;
    }
    if (input.brandLogo !== undefined) {
      data.brandLogo = emptyToNull(input.brandLogo);
    }
    if (input.brandFavicon !== undefined) {
      data.brandFavicon = emptyToNull(input.brandFavicon);
    }
    if (input.customDomain !== undefined) {
      data.customDomain = emptyToNull(input.customDomain);
    }
    if (typeof input.whiteLabelEnabled === 'boolean') {
      data.whiteLabelEnabled = input.whiteLabelEnabled;
    }

    await prisma.workspace.update({ where: { id: workspaceId }, data });
    logger.info('Branding updated', { workspaceId, fields: Object.keys(data) });
    return this.getBranding(workspaceId);
  },

  /**
   * Custom domain için DNS doğrulama stub'ı.
   * Gerçek implementasyonda CNAME/A record lookup yapılır.
   * Burada sadece format doğrulaması yapılır; production'da ext. API kullanılır.
   */
  validateCustomDomain(domain: string): { valid: boolean; reason?: string } {
    const trimmed = domain.trim().toLowerCase();
    if (!trimmed) return { valid: false, reason: 'Domain boş olamaz' };
    if (trimmed.length > 253) return { valid: false, reason: 'Domain çok uzun' };
    // basit domain format kontrolü (subdomain + . + TLD)
    const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(trimmed)) {
      return { valid: false, reason: 'Geçersiz domain formatı (örn. status.example.com)' };
    }
    if (trimmed.startsWith('www.')) {
      return { valid: false, reason: 'www subdomain kullanma, kök domain tercih edilir' };
    }
    return { valid: true };
  },

  /**
   * Branding değerlerinden --brand-primary CSS değişkeni içeren bir stil string'i üretir.
   * BrandingProvider bu string'i <style> etiketine yazarak uygular.
   *   - brandColor preset ise (blue/emerald/...) preset hex'ini kullanır
   *   - hex (#...) formatındaysa olduğu gibi kullanır
   *   - tanımsız değer ise default (blue) fallback yapılır
   */
  generateBrandCSS(branding: WorkspaceBranding): string {
    const raw = branding.brandColor ?? DEFAULT_BRAND_COLOR;
    const colorHex =
      BRAND_COLOR_PRESETS[raw] ??
      (raw.startsWith('#') ? raw : null) ??
      BRAND_COLOR_PRESETS[DEFAULT_BRAND_COLOR];
    const cssVars: string[] = [`--brand-primary: ${colorHex};`];

    if (branding.whiteLabelEnabled && branding.brandLogo) {
      cssVars.push(`--brand-logo: url('${branding.brandLogo}');`);
    }

    return `:root { ${cssVars.join(' ')} }`;
  },

  presets: BRAND_COLOR_PRESETS,
};

function emptyToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? null : trimmed;
}

export const __testables = { emptyToNull, BRAND_COLOR_PRESETS };
