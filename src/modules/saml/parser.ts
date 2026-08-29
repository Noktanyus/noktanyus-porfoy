/**
 * @file SAML 2.0 Schemas & Validation
 * @description D3: SAML SSO için temel veri yapıları.
 *
 *              SAML 2.0 — Security Assertion Markup Language
 *              IdP (Identity Provider) → SP (Service Provider) akışı.
 *              AuthnRequest → Response (Assertion) → validated session
 *
 *              Bu modül pure functions + XML parser içerir.
 *              Production'da @node-saml/node-saml veya samlify paketi
 *              kullanılmalı; burada basitleştirilmiş implementasyon.
 */

export type SAMLNameIdFormat =
  | "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
  | "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent"
  | "urn:oasis:names:tc:SAML:2.0:nameid-format:transient";

export interface SAMLConfig {
  /** IdP'nin entity ID'si (issuer) */
  idpEntityId: string;
  /** IdP SSO URL — AuthnRequest buraya POST'lanır */
  idpSsoUrl: string;
  /** IdP public certificate (PEM) — assertion imza doğrulaması için */
  idpCertificate: string;
  /** SP'nin entity ID'si (audience) */
  spEntityId: string;
  /** SP ACS URL — IdP response buraya POST'lanır */
  spAcsUrl: string;
  /** Name ID format tercihi */
  nameIdFormat: SAMLNameIdFormat;
}

export interface SAMLUser {
  /** SAML NameID (genelde email) */
  nameId: string;
  email: string;
  name?: string;
  /** IdP'den gelen attribute'lar */
  attributes: Record<string, string | string[]>;
  /** Session index — logout için kullanılır */
  sessionIndex: string;
}

export interface SAMLAssertion {
  issuer: string;
  destination: string;
  audience: string;
  recipient: string;
  notBefore: Date;
  notOnOrAfter: Date;
  /** Assertion yaşam süresi (saniye) */
  validitySeconds: number;
  user: SAMLUser;
  /** XML imzası — production'da doğrulanmalı */
  signature: string;
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
 * SAML timestamp parser — ISO 8601 veya SAML format (yyyy-MM-ddTHH:mm:ssZ).
 */
export function parseSAMLTimestamp(timestamp: string): Date {
  // SAML format genelde: 2024-01-01T00:00:00Z veya +miliseconds
  const parsed = new Date(timestamp);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid SAML timestamp: ${timestamp}`);
  }
  return parsed;
}

/**
 * Assertion süresi kontrolü — notBefore / notOnOrAfter.
 * Şu anki zaman aralıkta mı? (strict inequality — sınır anlar expired kabul edilir)
 */
export function isAssertionValid(
  notBefore: Date,
  notOnOrAfter: Date,
  now: Date = new Date(),
  clockSkewSeconds = 60
): boolean {
  const skew = clockSkewSeconds * 1000;
  const adjustedNow = now.getTime();
  return (
    adjustedNow > notBefore.getTime() - skew &&
    adjustedNow < notOnOrAfter.getTime() + skew
  );
}

/**
 * Audience restriction kontrolü.
 * SAML assertion'da audience alanı SP entity ID'mizi içermeli.
 */
export function validateAudience(
  audience: string[],
  expectedSpEntityId: string
): boolean {
  return audience.includes(expectedSpEntityId);
}

/**
 * Email validasyonu (basit).
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
  attributes: Record<string, string | string[]>,
  key: string
): string | null {
  const value = attributes[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * Assertion'dan kullanıcı çıkar.
 */
export function userFromAssertion(assertion: SAMLAssertion): SAMLUser | null {
  if (!isValidEmail(assertion.user.nameId)) return null;
  return {
    nameId: assertion.user.nameId,
    email: assertion.user.email ?? assertion.user.nameId,
    name: assertion.user.name,
    attributes: assertion.user.attributes,
    sessionIndex: assertion.user.sessionIndex,
  };
}