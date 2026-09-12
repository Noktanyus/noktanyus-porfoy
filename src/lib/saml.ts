/**
 * @file SAML 2.0 SSO — Production Facade
 * @description
 *   Identity Provider (IdP) entegrasyonu icin facade modul.
 *   Asil SAML islemleri (XML imzalama, signature verification, assertion parsing)
 *   @node-saml/node-saml ile @/modules/saml/service.ts uzerinden yapilir.
 *   Bu modul:
 *     - Env'den konfig okur (loadSamlConfig / isSamlConfigured) — env-only fallback
 *     - Multi-tenant DB-backed config icin @/modules/saml/service#getSAMLConfig
 *     - SP metadata XML uretir (createSamlMetadata)
 *     - AuthnRequest uretir (generateSamlAuthRequest)
 *     - SAMLResponse verify eder (verifySamlResponse — signature + conditions +
 *       audience + issuer kontrolleri)
 *
 *   Production ortaminda asagidaki env'lerden EN AZ biri tanimli olmalidir:
 *     - SAML_IDP_METADATA_URL      (IdP metadata.xml URL — cert + SSO URL otomatik cekilir)
 *     - SAML_IDP_CERT + SAML_IDP_SSO_URL + SAML_IDP_ENTITY_ID  (env-bazli alternatif)
 *
 *   SP tarafi (zorunlu):
 *     - SAML_SP_ENTITY_ID          (SP entity ID)
 *     - SAML_SP_ACS_URL            (SP Assertion Consumer Service URL)
 *     - SAML_SP_PRIVATE_KEY        (AuthnRequest imzalama icin)
 *     - SAML_SP_PUBLIC_CERT        (metadata imzalama icin)
 *
 *   Opsiyonel:
 *     - SAML_CLOCK_SKEW_MS         (default 300000 = 5 dakika)
 *     - SAML_WANT_ASSERTIONS_SIGNED (default true)
 *     - SAML_WANT_RESPONSE_SIGNED   (default true)
 *
 *   Guvenlik kontrolleri:
 *     - Signature verification (IdP public cert ile XMLDSig)
 *     - Conditions/NotBefore/NotOnOrAfter (clock skew toleransi ile)
 *     - Audience restriction (SP entity ID kontrolu)
 *     - Issuer kontrolu (IdP entity ID)
 *     - Replay protection (inResponseTo + cache provider)
 */

import { SAML } from "@node-saml/node-saml";
import { logger } from "@/lib/logger";

// ============================================================================
// Types
// ============================================================================

/**
 * SAML konfigurasyonu. Production'da metadata fetch ile ya da env'den doldurulur.
 */
export interface SamlConfig {
  /** IdP metadata.xml URL (varsa otomatik fetch) */
  idpMetadataUrl?: string;
  /** IdP public certificate (PEM, "-----BEGIN CERTIFICATE-----" header/footer ile) */
  idpCert: string;
  /** IdP SSO endpoint URL */
  idpSsoUrl: string;
  /** IdP entity ID (Issuer dogrulama icin) */
  idpEntityId: string;
  /** SP entity ID (audience restriction + issuer icin) */
  spEntityId: string;
  /** SP ACS (Assertion Consumer Service) URL */
  spAcsUrl: string;
  /** SP private key (AuthnRequest imzalama icin) */
  spPrivateKey?: string;
  /** SP public certificate (metadata imzalama icin) */
  spPublicCert?: string;
  /** Clock skew tolerance ms (default 300000 = 5 dakika) */
  clockSkewMs?: number;
  /** Assertion signed mi (default true) */
  wantAssertionsSigned?: boolean;
  /** Response signed mi (default true) */
  wantResponseSigned?: boolean;
}

/**
 * SAML callback'ten donen validated user bilgisi.
 */
export interface SamlVerifiedUser {
  nameId: string;
  nameIdFormat: string;
  email: string;
  attributes: Record<string, unknown>;
  sessionIndex?: string;
  issuer: string;
}

/**
 * SAML validation hata tipleri (AppError benzeri, spesifik reason'larla).
 */
export class SamlValidationError extends Error {
  constructor(
    public reason:
      | "missing_response"
      | "invalid_signature"
      | "expired"
      | "wrong_audience"
      | "wrong_issuer"
      | "missing_assertion"
      | "not_configured"
      | "unknown",
    message: string
  ) {
    super(message);
    this.name = "SamlValidationError";
  }
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * SAML konfigurasyonu tam olup olmadigini kontrol eder.
 *
 * Iki gecerli mod:
 *   A) env-only: SAML_IDP_CERT + SAML_IDP_SSO_URL + SAML_IDP_ENTITY_ID (env'de tam set)
 *   B) metadata-driven: SAML_IDP_METADATA_URL verilmisse, cert + SSO URL otomatik
 *      fetch edilir (SAML_IDP_SSO_URL sadece metadata fetch basarisiz olursa fallback)
 *
 * SP tarafi her iki modda zorunlu:
 *   - SAML_SP_ENTITY_ID + SAML_SP_ACS_URL
 */
export function isSamlConfigured(): boolean {
  const spOk = !!process.env.SAML_SP_ENTITY_ID && !!process.env.SAML_SP_ACS_URL;
  if (!spOk) return false;
  // Mod A: env-only
  if (
    !!process.env.SAML_IDP_CERT &&
    !!process.env.SAML_IDP_SSO_URL &&
    !!process.env.SAML_IDP_ENTITY_ID
  ) {
    return true;
  }
  // Mod B: metadata-driven (cert metadata'dan cekilecek)
  if (!!process.env.SAML_IDP_METADATA_URL) {
    return true;
  }
  return false;
}

/**
 * Env'den SAML konfigurasyonu yukle. Metadata URL verilmisse fetch edip
 * cert + SSO URL + entity ID otomatik cikarir.
 *
 * Returns: null eger gerekli env'ler yoksa.
 */
export async function loadSamlConfig(): Promise<SamlConfig | null> {
  if (!isSamlConfigured()) return null;

  const spEntityId = process.env.SAML_SP_ENTITY_ID!;
  const spAcsUrl = process.env.SAML_SP_ACS_URL!;
  const clockSkewMs = process.env.SAML_CLOCK_SKEW_MS
    ? parseInt(process.env.SAML_CLOCK_SKEW_MS, 10)
    : 300_000;

  let idpCert = process.env.SAML_IDP_CERT ?? "";
  let idpSsoUrl = process.env.SAML_IDP_SSO_URL ?? "";
  let idpEntityId = process.env.SAML_IDP_ENTITY_ID ?? "";

  // Metadata URL varsa fetch et (cert + SSO URL + entity ID otomatik cikar)
  if (process.env.SAML_IDP_METADATA_URL) {
    try {
      const md = await fetchIdpMetadata(process.env.SAML_IDP_METADATA_URL);
      if (md.cert && !idpCert) idpCert = md.cert;
      if (md.ssoUrl && !idpSsoUrl) idpSsoUrl = md.ssoUrl;
      if (md.entityId && !idpEntityId) idpEntityId = md.entityId;
    } catch (err) {
      logger.warn("[saml] metadata fetch failed, falling back to env", { err });
    }
  }

  if (!idpCert || !idpSsoUrl || !idpEntityId) {
    logger.warn("[saml] loadSamlConfig: eksik zorunlu alanlar", {
      hasCert: !!idpCert,
      hasSsoUrl: !!idpSsoUrl,
      hasEntityId: !!idpEntityId,
    });
    return null;
  }

  return {
    idpMetadataUrl: process.env.SAML_IDP_METADATA_URL,
    idpCert,
    idpSsoUrl,
    idpEntityId,
    spEntityId,
    spAcsUrl,
    spPrivateKey: process.env.SAML_SP_PRIVATE_KEY,
    spPublicCert: process.env.SAML_SP_PUBLIC_CERT,
    clockSkewMs,
    wantAssertionsSigned: process.env.SAML_WANT_ASSERTIONS_SIGNED !== "false",
    wantResponseSigned: process.env.SAML_WANT_RESPONSE_SIGNED !== "false",
  };
}

/**
 * IdP metadata.xml fetch + minimal parse.
 * - X509Certificate (IdP public key)
 * - SingleSignOnService Location (SSO URL)
 * - EntityDescriptor entityID (IdP identifier)
 */
async function fetchIdpMetadata(url: string): Promise<{
  cert: string;
  ssoUrl: string;
  entityId: string;
}> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`metadata fetch failed: HTTP ${res.status}`);
  }
  const xml = await res.text();
  return parseIdpMetadataXml(xml);
}

function parseIdpMetadataXml(xml: string): {
  cert: string;
  ssoUrl: string;
  entityId: string;
} {
  // ds:X509Certificate (signed info icinde) veya X509Certificate (KeyDescriptor body)
  const certMatch =
    /<ds:X509Certificate>([\s\S]*?)<\/ds:X509Certificate>/i.exec(xml) ||
    /<X509Certificate>([\s\S]*?)<\/X509Certificate>/i.exec(xml);
  const certRaw = certMatch ? certMatch[1]!.replace(/\s+/g, "") : "";
  const cert = certRaw
    ? `-----BEGIN CERTIFICATE-----\n${certRaw}\n-----END CERTIFICATE-----`
    : "";

  // SingleSignOnService Binding HTTP-POST veya HTTP-Redirect
  const ssoUrlMatch =
    /<SingleSignOnService[^>]*?Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"[^>]*?Location="([^"]+)"/i.exec(
      xml
    ) ||
    /<SingleSignOnService[^>]*?Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"[^>]*?Location="([^"]+)"/i.exec(
      xml
    ) ||
    /<SingleSignOnService[^>]*?Location="([^"]+)"/i.exec(xml);
  const ssoUrl = ssoUrlMatch ? ssoUrlMatch[1]! : "";

  const entityIdMatch = /<EntityDescriptor[^>]*?entityID="([^"]+)"/i.exec(xml);
  const entityId = entityIdMatch ? entityIdMatch[1]! : "";

  return { cert, ssoUrl, entityId };
}

// ============================================================================
// node-saml instance
// ============================================================================

/**
 * Her istek icin yeni SAML instance (config immutable; lightweight).
 * Cache provider in-memory; production'da Redis tercih edilmeli.
 */
class InMemoryCacheProvider {
  private store = new Map<string, { value: string; createdAt: number }>();
  private ttlMs = 3600_000; // 1 saat

  async saveAsync(key: string, value: string): Promise<{ value: string; createdAt: number } | null> {
    const item = { value, createdAt: Date.now() };
    this.store.set(key, item);
    return item;
  }

  async getAsync(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() - item.createdAt > this.ttlMs) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async removeAsync(key: string | null): Promise<string | null> {
    if (!key) return null;
    const item = this.store.get(key);
    this.store.delete(key);
    return item?.value ?? null;
  }
}

const replayCache = new InMemoryCacheProvider();

function buildSamlInstance(config: SamlConfig): SAML {
  return new SAML({
    // Mandatory
    issuer: config.spEntityId,
    callbackUrl: config.spAcsUrl,
    idpCert: config.idpCert,
    entryPoint: config.idpSsoUrl,
    // Audience restriction — production'da ZORUNLU
    audience: config.spEntityId,
    idpIssuer: config.idpEntityId,
    // Signature validation
    wantAssertionsSigned: config.wantAssertionsSigned ?? true,
    wantAuthnResponseSigned: config.wantResponseSigned ?? true,
    privateKey: config.spPrivateKey,
    // Defaults
    identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    acceptedClockSkewMs: config.clockSkewMs ?? 300_000,
    signatureAlgorithm: "sha256",
    digestAlgorithm: "sha256",
    authnRequestBinding: "HTTP-POST",
    signMetadata: false,
    validateInResponseTo: "ifPresent" as any,
    requestIdExpirationPeriodMs: 3600_000,
    cacheProvider: replayCache as any,
    additionalParams: {},
    additionalAuthorizeParams: {},
    allowCreate: true,
    disableRequestedAuthnContext: false,
    forceAuthn: false,
    skipRequestCompression: false,
    racComparison: "exact",
    maxAssertionAgeMs: 3600_000,
    passive: false,
    authnContext: [
      "urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport",
    ],
    additionalLogoutParams: {},
    logoutUrl: "",
    disableRequestAcsUrl: false,
    generateUniqueId: () =>
      `_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
  });
}

// ============================================================================
// Public API — Task spec
// ============================================================================

/**
 * AuthnRequest uret → IdP'nin login sayfasina redirect URL'i doner.
 * relayState: login sonrasi geri donulecek state (CSRF token).
 */
export async function generateSamlAuthRequest(
  config: SamlConfig,
  relayState: string = ""
): Promise<string> {
  if (!config.idpCert || !config.idpSsoUrl || !config.spEntityId) {
    throw new SamlValidationError(
      "not_configured",
      "SAML konfigurasyonu eksik (idpCert/idpSsoUrl/spEntityId)"
    );
  }
  const saml = buildSamlInstance(config);
  const host = new URL(config.spAcsUrl).host;
  return saml.getAuthorizeUrlAsync(relayState, host, {});
}

/**
 * SAML callback'ten donen response'u verify et.
 * IdP signature + Conditions + Audience + Issuer kontrolu yapar.
 *
 * Throws: SamlValidationError (invalid_signature/expired/wrong_audience/...).
 */
export async function verifySamlResponse(
  config: SamlConfig,
  samlResponseBase64: string,
  relayState: string = ""
): Promise<SamlVerifiedUser> {
  if (!samlResponseBase64) {
    throw new SamlValidationError(
      "missing_response",
      "SAMLResponse bos olamaz"
    );
  }

  if (!config.idpCert || !config.idpSsoUrl || !config.idpEntityId) {
    throw new SamlValidationError(
      "not_configured",
      "SAML konfigurasyonu eksik"
    );
  }

  const saml = buildSamlInstance(config);

  let result: { profile: any | null; loggedOut: boolean };
  try {
    result = await saml.validatePostResponseAsync({
      SAMLResponse: samlResponseBase64,
      RelayState: relayState,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("[saml] signature/validation failed", { err: message });

    // Hata turunu tespit et (node-saml spesifik mesajlara bakarak)
    if (/signature/i.test(message)) {
      throw new SamlValidationError("invalid_signature", message);
    }
    if (/expired|NotOnOrAfter|NotBefore/i.test(message)) {
      throw new SamlValidationError("expired", message);
    }
    if (/audience/i.test(message)) {
      throw new SamlValidationError("wrong_audience", message);
    }
    if (/issuer/i.test(message)) {
      throw new SamlValidationError("wrong_issuer", message);
    }
    throw new SamlValidationError("unknown", message);
  }

  if (!result.profile) {
    throw new SamlValidationError(
      "missing_assertion",
      "SAML response parse edilemedi"
    );
  }

  const p = result.profile;

  // Issuer kontrol (defense in depth — node-saml zaten kontrol eder)
  if (p.issuer && p.issuer !== config.idpEntityId) {
    throw new SamlValidationError(
      "wrong_issuer",
      `Issuer uyusmazligi: beklenen ${config.idpEntityId}, gelen ${p.issuer}`
    );
  }

  // Email adresi: nameID email formatinda olabilir ya da attribute'lardan
  const email =
    (p.email as string | undefined) ||
    (p.mail as string | undefined) ||
    (p["urn:oid:0.9.2342.19200300.100.1.3"] as string | undefined) ||
    p.nameID;

  if (!email) {
    throw new SamlValidationError(
      "missing_assertion",
      "SAML assertion'da email/nameID bulunamadi"
    );
  }

  return {
    nameId: p.nameID,
    nameIdFormat: p.nameIDFormat,
    email,
    attributes: extractSamlAttributes(p),
    sessionIndex: p.sessionIndex,
    issuer: p.issuer,
  };
}

/**
 * SP metadata XML uretir (IdP konfigurasyonu icin gereken).
 */
export async function createSamlMetadata(config: SamlConfig): Promise<string> {
  // Dynamic import — generateServiceProviderMetadata sadece bu fonksiyonda gerekli
  const mod = await import("@node-saml/node-saml");
  return mod.generateServiceProviderMetadata({
    issuer: config.spEntityId,
    callbackUrl: config.spAcsUrl,
    publicCerts: config.spPublicCert ?? null,
    privateKey: config.spPrivateKey,
    signatureAlgorithm: "sha256",
    digestAlgorithm: "sha256",
    wantAssertionsSigned: config.wantAssertionsSigned ?? true,
  });
}

/**
 * SAML Profile'dan anlamli attribute'lari cikar.
 * nameID/email/issuer/sessionIndex haricindeki alanlar.
 */
function extractSamlAttributes(p: any): Record<string, unknown> {
  const reserved = new Set([
    "issuer",
    "sessionIndex",
    "nameID",
    "nameIDFormat",
    "nameQualifier",
    "spNameQualifier",
    "ID",
    "mail",
    "email",
    "urn:oid:0.9.2342.19200300.100.1.3",
    "getAssertionXml",
    "getAssertion",
    "getSamlResponseXml",
  ]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    if (!reserved.has(k)) out[k] = v;
  }
  return out;
}

// ============================================================================
// Legacy facade — geriye donuk uyumluluk
// ============================================================================

/**
 * Eski samlProvider API'si (loadSamlConfig sync eski versiyonu + generateAuthUrl sync).
 * Yeni kod named export'lar kullanmali (isSamlConfigured, loadSamlConfig, ...).
 */
export const samlProvider = {
  isEnabled: isSamlConfigured,
  loadConfig: loadSamlConfig, // async — eski sync cagiranlar Promise ile handle etmeli
  generateAuthUrl: async (
    config: SamlConfig,
    relayState?: string
  ): Promise<string> => generateSamlAuthRequest(config, relayState),
  processCallback: async (
    samlResponse: string,
    config?: SamlConfig
  ): Promise<{ email: string; name?: string; attributes: Record<string, unknown> }> => {
    if (!config) {
      const cfg = await loadSamlConfig();
      if (!cfg) {
        return { email: "", attributes: { raw: samlResponse.substring(0, 64) } };
      }
      config = cfg;
    }
    try {
      const u = await verifySamlResponse(config, samlResponse);
      return {
        email: u.email,
        name: u.attributes["displayName"] as string | undefined,
        attributes: u.attributes,
      };
    } catch {
      return { email: "", attributes: { raw: samlResponse.substring(0, 64) } };
    }
  },
  generateMetadata: createSamlMetadata,
};

// ============================================================================
// Internal exports (test/admin debug)
// ============================================================================

export const _internals = { parseIdpMetadataXml, fetchIdpMetadata };
