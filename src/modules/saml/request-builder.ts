/**
 * @file SAML Request Builder
 * @description D3: SAML AuthnRequest oluşturma.
 *              SP → IdP yönlendirmesi için gerekli XML ve encoded form.
 */

import type { SAMLConfig, SAMLNameIdFormat } from "./parser";
import { DEFAULT_NAME_ID_FORMAT } from "./parser";

/**
 * SAML AuthnRequest XML üretir.
 * IdP'ye gönderilecek base64-encoded XML.
 */
export function buildAuthnRequest(
  config: Pick<SAMLConfig, "spEntityId" | "spAcsUrl">,
  options?: {
    nameIdFormat?: SAMLNameIdFormat;
    /** CSRF/token — AuthnRequest ile response eşleştirmesi için */
    requestId?: string;
    /** Force re-authentication (IdP login ekranına yönlendirir) */
    forceAuthn?: boolean;
  }
): string {
  const requestId = options?.requestId ?? `_${generateId()}`;
  const issueInstant = new Date().toISOString();
  const nameIdFormat = options?.nameIdFormat ?? DEFAULT_NAME_ID_FORMAT;
  const forceAuthn = options?.forceAuthn ? ' ForceAuthn="true"' : "";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${escapeXml(requestId)}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  Destination="${escapeXml(config.spEntityId)}"${forceAuthn}>
  <saml:Issuer>${escapeXml(config.spEntityId)}</saml:Issuer>
  <samlp:NameIDPolicy
    Format="${escapeXml(nameIdFormat)}"
    AllowCreate="true" />
</samlp:AuthnRequest>`;

  return xml;
}

/**
 * AuthnRequest'i base64 encode edip IdP'ye POST edilecek HTML form üretir.
 * Kullanıcı tarayıcıda otomatik redirect edilir.
 */
export function buildRedirectForm(
  idpSsoUrl: string,
  samlRequest: string,
  relayState?: string
): string {
  const encoded = base64Encode(samlRequest);
  const relayField = relayState
    ? `<input type="hidden" name="RelayState" value="${escapeHtml(relayState)}" />`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Redirecting to IdP...</title>
</head>
<body onload="document.forms[0].submit()">
  <noscript>JavaScript kapalı. Yönlendirme için aşağıdaki butona tıklayın.</noscript>
  <form method="POST" action="${escapeHtml(idpSsoUrl)}">
    <input type="hidden" name="SAMLRequest" value="${escapeHtml(encoded)}" />
    ${relayField}
    <button type="submit">Continue to SSO Login</button>
  </form>
</body>
</html>`;
}

/**
 * Basit random ID generator (test edilebilir).
 */
function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function base64Encode(input: string): string {
  if (typeof window !== "undefined") {
    return window.btoa(unescape(encodeURIComponent(input)));
  }
  // Node.js (server-side)
  return Buffer.from(input, "utf-8").toString("base64");
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeHtml(input: string): string {
  return escapeXml(input);
}