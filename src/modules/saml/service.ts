/**
 * @file SAML Service
 * @description D3: SAML SSO authentication flow.
 *              IdP metadata + role mapping + audit log.
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { SAMLConfig, SAMLUser } from "./parser";
import { isValidEmail, extractAttribute } from "./parser";

/**
 * SAML SSO ayarlarını DB'den al.
 */
export const samlConfigService = {
  async getConfig(workspaceId: string): Promise<SAMLConfig | null> {
    const cfg = await prisma.ssoConfig.findUnique({
      where: { workspaceId },
    });
    if (!cfg) return null;

    return {
      idpEntityId: cfg.idpEntityId,
      idpSsoUrl: cfg.idpSsoUrl,
      idpCertificate: cfg.idpCertificate,
      spEntityId: cfg.spEntityId,
      spAcsUrl: cfg.spAcsUrl,
      nameIdFormat: cfg.nameIdFormat as SAMLConfig["nameIdFormat"],
    };
  },

  async upsertConfig(workspaceId: string, config: SAMLConfig): Promise<void> {
    await prisma.ssoConfig.upsert({
      where: { workspaceId },
      create: { workspaceId, ...config },
      update: { ...config },
    });
  },

  async disableConfig(workspaceId: string): Promise<void> {
    await prisma.ssoConfig.deleteMany({ where: { workspaceId } });
  },
};

/**
 * SAML assertion doğrulandıktan sonra kullanıcı işlemleri.
 */
export const samlAuthService = {
  /**
   * SAML user bilgisinden NextAuth user oluşturur.
   * İlk kez giriyorsa otomatik User kaydı oluşturur.
   */
  async findOrCreateUser(samlUser: SAMLUser): Promise<{ userId: string; created: boolean }> {
    if (!isValidEmail(samlUser.email)) {
      throw new Error("SAML user must have a valid email");
    }

    const existing = await prisma.user.findUnique({
      where: { email: samlUser.email },
    });

    if (existing) {
      // SAML subject ID'yi kaydet (varsa)
      return { userId: existing.id, created: false };
    }

    // Yeni kullanıcı oluştur — SAML SSO ile giriş yapan kullanıcılar
    // emailVerified otomatik true olur (IdP tarafından doğrulanmış kabul ediyoruz).
    const created = await prisma.user.create({
      data: {
        email: samlUser.email,
        name: samlUser.name ?? samlUser.email.split("@")[0] ?? "SAML User",
        emailVerified: new Date(),
        role: "user",
      },
    });

    logger.info(`[saml] new user auto-provisioned: ${created.email}`);
    return { userId: created.id, created: true };
  },

  /**
   * SAML attribute → User role mapping.
   * Default: SAML "role" attribute'u veya "user".
   */
  mapRoleFromAttributes(
    attributes: Record<string, string | string[]>
  ): "user" | "admin" | "moderator" {
    const roleAttr = extractAttribute(attributes, "role");
    if (!roleAttr) return "user";
    const normalized = roleAttr.toLowerCase();
    if (normalized === "admin" || normalized === "administrator") return "admin";
    if (normalized === "moderator" || normalized === "mod") return "moderator";
    return "user";
  },

  /**
   * SAML login audit log.
   */
  async auditLogin(
    userId: string,
    workspaceId: string,
    samlUser: SAMLUser,
    success: boolean
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: success ? "saml_login_success" : "saml_login_failed",
          entity: "user",
          entityId: userId,
          userId,
          workspaceId,
          metadata: {
            email: samlUser.email,
            sessionIndex: samlUser.sessionIndex,
            nameIdFormat: samlUser.attributes["nameIdFormat"],
          } as object,
        },
      });
    } catch (err) {
      logger.warn("[saml] audit log failed:", err);
    }
  },
};

/**
 * SAML IdP metadata parser.
 * IdP'den gelen XML metadata'yı parse edip SAMLConfig'e çevirir.
 */
export function parseIdpMetadata(xml: string): Partial<SAMLConfig> | null {
  try {
    const entityIdMatch = /<EntityDescriptor[^>]*entityID="([^"]+)"/i.exec(xml);
    const ssoUrlMatch =
      /<SingleSignOnService[^>]*Location="([^"]+)"/i.exec(xml);
    const certMatch = /<X509Certificate>([^<]+)<\/X509Certificate>/i.exec(xml);

    if (!entityIdMatch || !ssoUrlMatch || !certMatch) return null;

    return {
      idpEntityId: entityIdMatch[1] ?? "",
      idpSsoUrl: ssoUrlMatch[1] ?? "",
      idpCertificate: (certMatch[1] ?? "").trim(),
    };
  } catch {
    return null;
  }
}