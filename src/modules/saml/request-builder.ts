/**
 * @file SAML Request Builder — Deprecated wrapper
 * @description Bu dosya geriye dönük uyumluluk için bırakıldı.
 *              Production'da `service.ts` içindeki `samlAuthService.getAuthorizeForm`
 *              ve `getAuthorizeUrl` kullanılmalı (node-saml wrapper).
 *
 *              Eski fonksiyonlar (buildAuthnRequest, buildRedirectForm)
 *              sadece test/demo amaçlıdır ve artık kullanılmamalı.
 *              Gelecek sürümde kaldırılacak.
 */

export function buildAuthnRequest(
  _config: { spEntityId: string; spAcsUrl: string },
  _options?: { nameIdFormat?: string; requestId?: string; forceAuthn?: boolean }
): string {
  throw new Error(
    "buildAuthnRequest kullanım dışı. " +
      "Bunun yerine samlAuthService.getAuthorizeForm(workspaceId, relayState) kullanın. " +
      "Production SAML akışı src/modules/saml/service.ts içinde node-saml üzerinden yürür."
  );
}

export function buildRedirectForm(
  _idpSsoUrl: string,
  _samlRequest: string,
  _relayState?: string
): string {
  throw new Error(
    "buildRedirectForm kullanım dışı. " +
      "Bunun yerine samlAuthService.getAuthorizeForm() kullanın."
  );
}