/**
 * @file SAML 2.0 Schemas & Validation
 * @description D3: SAML SSO için temel veri yapıları.
 *              @node-saml/node-saml kütüphanesi üzerine inşa edilmiştir —
 *              XML parsing, signature validation ve timing kontrolü
 *              kütüphane tarafından production-ready yapılır.
 *
 *              SAML 2.0 — Security Assertion Markup Language
 *              IdP (Identity Provider) → SP (Service Provider) akışı.
 *              AuthnRequest → Response (Assertion) → validated session
 */

import { Profile as NodeSAMLProfile } from "@node-saml/node-saml";

export type SAMLNameIdFormat =
  | "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
  | "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent"
  | "urn:oasis:names:tc:SAML:2.0:nameid-format:transient";

/**
 * node-saml SamlConfig için gerekli alanlar.
 * Prisma'dan okur, node-saml constructor'a geçiririz.
 */
export interface SAMLConfig {
  /** IdP'nin entity ID'si */
  idpEntityId: string;
  /** IdP SSO URL — AuthnRequest buraya POST'lanır */
  idpSsoUrl: string;
  /** IdP public certificate (PEM, header/footer dahil) */
  idpCertificate: string;
  /** SP'nin entity ID'si (issuer) */
  spEntityId: string;
  /** SP ACS URL — IdP response buraya POST'lanır */
  spAcsUrl: string;
  /** Name ID format tercihi */
  nameIdFormat: SAMLNameIdFormat;
}

/**
 * Validate edilmiş SAML user objesi.
 * node-saml'in `Profile` tipini normalize eder.
 */
export interface SAMLUser {
  nameId: string;
  email: string;
  name?: string;
  attributes: Record<string, string | string[]>;
  sessionIndex: string;
  issuer: string;
  /** Validate edilmiş NameID format */
  nameIdFormat?: string;
}

/**
 * Default Name ID format — en yaygın kullanılan.
 */
export const DEFAULT_NAME_ID_FORMAT: SAMLNameIdFormat =
  "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress";

/**
 * SAML Name ID format validasyonu.
 */
export function isValidNameIdFormat(value: unknown): value is SAMLNameIdFormat {
  return (
    typeof value === "string" &&
    [
      "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
      "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
    ].includes(value)
  );
}

/**
 * Email validasyonu.
 */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * SAML attribute'dan tekil değer çıkar.
 * SAML attribute'lar string veya string[] olabilir.
 */
export function extractAttribute(
  attributes: Record<string, unknown>,
  key: string
): string | null {
  const value = attributes[key];
  if (Array.isArray(value)) return (value[0] as string) ?? null;
  if (typeof value === "string") return value;
  return null;
}

/**
 * node-saml Profile → normalize edilmiş SAMLUser.
 * Email, name, attributes standartlaştırılır.
 */
export function normalizeProfile(
  profile: NodeSAMLProfile,
  issuer: string
): SAMLUser | null {
  const emailCandidate =
    extractAttribute(
      profile.attributes as Record<string, unknown>,
      "email"
    ) ?? (isValidEmail(profile.nameID) ? profile.nameID : null);

  if (!emailCandidate) return null;

  const attributes: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(profile.attributes ?? {})) {
    if (Array.isArray(value)) {
      attributes[key] = value.filter(
        (v): v is string => typeof v === "string"
      );
    } else if (typeof value === "string") {
      attributes[key] = value;
    }
  }

  return {
    nameId: profile.nameID,
    email: emailCandidate,
    name:
      extractAttribute(
        profile.attributes as Record<string, unknown>,
        "name"
      ) ?? undefined,
    attributes,
    sessionIndex: profile.sessionIndex ?? "",
    issuer,
    nameIdFormat: (profile as { nameIDFormat?: string }).nameIDFormat,
  };
}

/**
 * Audience restriction kontrolü.
 * SAML assertion'da audience alanı SP entity ID'mizi içermeli.
 *
 * Not: node-saml validatePostResponseAsync bu kontrolü kendi içinde yapar.
 * Burada extra defensive check için kullanılabilir.
 */
export function validateAudience(
  audience: string[],
  expectedSpEntityId: string
): boolean {
  if (!Array.isArray(audience) || audience.length === 0) return false;
  return audience.includes(expectedSpEntityId);
}

/**
 * SAML XML escape — AuthnRequest manual olarak oluşturulduğunda kullanılır.
 * node-saml getAuthorizeFormAsync de aynı kaçışı uygular.
 */
export function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * SAML timestamp validation — NotBefore / NotOnOrAfter kontrolü.
 * node-saml checkTimestampsValidityError benzeri mantık; burada manuel kontrol için.
 */
export function isTimestampInWindow(
  notBefore: string | Date,
  notOnOrAfter: string | Date,
  nowMs: number = Date.now(),
  clockSkewSeconds = 60
): boolean {
  const skewMs = clockSkewSeconds * 1000;
  const startMs = notBefore instanceof Date ? notBefore.getTime() : Date.parse(notBefore);
  const endMs = notOnOrAfter instanceof Date ? notOnOrAfter.getTime() : Date.parse(notOnOrAfter);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return false;
  return nowMs > startMs - skewMs && nowMs < endMs + skewMs;
}