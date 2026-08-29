/**
 * @file SAML Service — node-saml entegrasyonu
 * @description D3: SAML SSO authentication flow.
 *              @node-saml/node-saml kütüphanesi üzerinden tam production-ready.
 *
 *              Akış:
 *              1. SP → samlService.getAuthorizeFormAsync() → HTML form → IdP'ye POST
 *              2. IdP kullanıcıyı login → SAMLResponse ile SP'ye döner
 *              3. SP ACS endpoint → samlService.validatePostResponseAsync() → Profile
 *              4. Profile → samlAuthService.findOrCreateUser() → NextAuth session
 *
 *              node-saml signature, timestamp ve audience validation'ı
 *              kendi içinde yapar (production-grade cryptography).
 */

import { SAML, type SamlConfig as NodeSAMLConfig, type Profile as NodeSAMLProfile } from "@node-saml/node-saml";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  type SAMLConfig,
  type SAMLUser,
  isValidEmail,
  extractAttribute,
  normalizeProfile,
} from "./parser";

/**
 * SAMLConfig (DB) → node-saml SamlConfig dönüşümü.
 * node-saml zorunlu alanlar: idpCert, issuer, callbackUrl.
 */
function toNodeSAMLConfig(cfg: SAMLConfig): NodeSAMLConfig {
  return {
    // Zorunlu
    issuer: cfg.spEntityId,
    callbackUrl: cfg.spAcsUrl,
    idpCert: cfg.idpCertificate,
    // Opsiyonel
    entryPoint: cfg.idpSsoUrl,
    identifierFormat: cfg.nameIdFormat,
    allowCreate: true,
    // Signature validation her zaman aktif
    wantAssertionsSigned: true,
    signMetadata: false,
    // Audience restriction — production'da ZORUNLU
    audience: cfg.spEntityId,
    // Clock skew tolerance (5 dakika — corporate IdP'ler için makul)
    acceptedClockSkewMs: 5 * 60 * 1000,
    // RelayState validation
    validateInResponseTo: "always",
    // Cache provider — production'da Redis'e geçirilebilir
    cacheProvider: "in-memory",
  };
}

/**
 * Workspace SAML config cache — her request'te DB'ye gitmemek için.
 */
const configCache = new Map<string, { config: SAMLConfig; nodeConfig: NodeSAMLConfig; expiresAt: number }>();
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Workspace SAML ayarlarını DB'den alıp node-saml config'ine çevirir.
 */
export async function getSAMLConfig(workspaceId: string): Promise<NodeSAMLConfig | null> {
  const cached = configCache.get(workspaceId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.nodeConfig;
  }

  const dbConfig = await prisma.ssoConfig.findUnique({
    where: { workspaceId },
  });

  if (!dbConfig) {
    configCache.delete(workspaceId);
    return null;
  }

  const config: SAMLConfig = {
    idpEntityId: dbConfig.idpEntityId,
    idpSsoUrl: dbConfig.idpSsoUrl,
    idpCertificate: dbConfig.idpCertificate,
    spEntityId: dbConfig.spEntityId,
    spAcsUrl: dbConfig.spAcsUrl,
    nameIdFormat: dbConfig.nameIdFormat as SAMLConfig["nameIdFormat"],
  };

  const nodeConfig = toNodeSAMLConfig(config);
  configCache.set(workspaceId, {
    config,
    nodeConfig,
    expiresAt: Date.now() + CONFIG_CACHE_TTL_MS,
  });
  return nodeConfig;
}

/**
 * SAML SSO ayarlarını yönet.
 */
export const samlConfigService = {
  async getConfig(workspaceId: string): Promise<SAMLConfig | null> {
    const cached = configCache.get(workspaceId);
    if (cached && cached.expiresAt > Date.now()) return cached.config;
    const dbConfig = await prisma.ssoConfig.findUnique({ where: { workspaceId } });
    if (!dbConfig) return null;
    return {
      idpEntityId: dbConfig.idpEntityId,
      idpSsoUrl: dbConfig.idpSsoUrl,
      idpCertificate: dbConfig.idpCertificate,
      spEntityId: dbConfig.spEntityId,
      spAcsUrl: dbConfig.spAcsUrl,
      nameIdFormat: dbConfig.nameIdFormat as SAMLConfig["nameIdFormat"],
    };
  },

  async upsertConfig(workspaceId: string, config: SAMLConfig): Promise<void> {
    await prisma.ssoConfig.upsert({
      where: { workspaceId },
      create: { workspaceId, ...config },
      update: { ...config },
    });
    configCache.delete(workspaceId);
  },

  async disableConfig(workspaceId: string): Promise<void> {
    await prisma.ssoConfig.deleteMany({ where: { workspaceId } });
    configCache.delete(workspaceId);
  },
};

/**
 * SAML SSO authentication akışı.
 */
export const samlAuthService = {
  /**
   * SP → IdP yönlendirme formu üret.
   * Kullanıcı tarayıcıda otomatik IdP'ye POST'lanır.
   */
  async getAuthorizeForm(
    workspaceId: string,
    relayState: string,
    host?: string
  ): Promise<string | null> {
    const nodeConfig = await getSAMLConfig(workspaceId);
    if (!nodeConfig) return null;
    const saml = new SAML(nodeConfig);
    return saml.getAuthorizeFormAsync(relayState, host);
  },

  /**
   * SP → IdP yönlendirme URL'i üret (HTTP-Redirect binding için).
   */
  async getAuthorizeUrl(
    workspaceId: string,
    relayState: string,
    host?: string
  ): Promise<string | null> {
    const nodeConfig = await getSAMLConfig(workspaceId);
    if (!nodeConfig) return null;
    const saml = new SAML(nodeConfig);
    return saml.getAuthorizeUrlAsync(relayState, host, {});
  },

  /**
   * IdP'den gelen SAMLResponse'ı validate et.
   * node-saml signature + timestamp + audience validation'ı yapar.
   * Production-grade XMLDSig doğrulaması.
   */
  async validateResponse(
    workspaceId: string,
    samlResponse: Record<string, string>
  ): Promise<{ user: SAMLUser; issuer: string } | null> {
    const nodeConfig = await getSAMLConfig(workspaceId);
    if (!nodeConfig) {
      logger.warn(`[saml] No SSO config for workspace ${workspaceId}`);
      return null;
    }
    const saml = new SAML(nodeConfig);

    try {
      const { profile } = await saml.validatePostResponseAsync(samlResponse);
      if (!profile) return null;

      const normalized = normalizeProfile(profile, profile.issuer);
      if (!normalized) {
        logger.warn("[saml] profile normalization failed");
        return null;
      }

      return { user: normalized, issuer: profile.issuer };
    } catch (err) {
      logger.error("[saml] validatePostResponseAsync failed:", err);
      return null;
    }
  },

  /**
   * SAML user'dan NextAuth user oluştur.
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
      return { userId: existing.id, created: false };
    }

    const created = await prisma.user.create({
      data: {
        email: samlUser.email,
        name: samlUser.name ?? samlUser.email.split("@")[0] ?? "SAML User",
        emailVerified: new Date(),
        role: this.mapRoleFromAttributes(samlUser.attributes),
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
            issuer: samlUser.issuer,
            nameIdFormat: samlUser.nameIdFormat,
          } as object,
        },
      });
    } catch (err) {
      logger.warn("[saml] audit log failed:", err);
    }
  },
};

/**
 * SAML IdP metadata XML parser.
 * IdP'den gelen metadata'yı SAMLConfig'e çevirir.
 *
 * Production'da xml2js veya @xmldom/xmldom kullanılır;
 * basit regex parser yeterli (IdP metadata standart XML).
 */
export function parseIdpMetadata(xml: string): Partial<SAMLConfig> | null {
  try {
    const entityIdMatch = /<EntityDescriptor[^>]*entityID="([^"]+)"/i.exec(xml);
    const ssoUrlMatch =
      /<SingleSignOnService[^>]*Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"[^>]*Location="([^"]+)"|<SingleSignOnService[^>]*Location="([^"]+)"/i.exec(xml);
    const certMatch = /<X509Certificate>([^<]+)<\/X509Certificate>/i.exec(xml);

    if (!entityIdMatch || !ssoUrlMatch || !certMatch) return null;

    // SSO URL fallback (sıralama önemli — POST binding öncelikli)
    const ssoUrl = ssoUrlMatch[1] || ssoUrlMatch[2] || "";
    const certRaw = (certMatch[1] ?? "").trim();

    // PEM header/footer yoksa ekle
    const idpCertificate = certRaw.includes("BEGIN CERTIFICATE")
      ? certRaw
      : `-----BEGIN CERTIFICATE-----\n${certRaw}\n-----END CERTIFICATE-----`;

    return {
      idpEntityId: entityIdMatch[1] ?? "",
      idpSsoUrl: ssoUrl,
      idpCertificate,
    };
  } catch {
    return null;
  }
}

/**
 * Test için: SAML instance oluştur (DB'ye gitmeden).
 * Production'da çağrılmaz.
 */
export function createSAMLInstance(cfg: NodeSAMLConfig): SAML {
  return new SAML(cfg);
}

/**
 * Test/dev için cache temizleme.
 */
export function clearSAMLConfigCache(): void {
  configCache.clear();
}

// node-saml types re-export
export type { NodeSAMLConfig, NodeSAMLProfile };