/**
 * @file SAML module tests
 * @description D3: parser, request builder, service testleri.
 */

import { describe, it, expect } from "vitest";
import {
  isValidNameIdFormat,
  parseSAMLTimestamp,
  isAssertionValid,
  validateAudience,
  isValidEmail,
  extractAttribute,
  userFromAssertion,
  DEFAULT_NAME_ID_FORMAT,
  type SAMLAssertion,
  type SAMLUser,
} from "../parser";
import { buildAuthnRequest, buildRedirectForm } from "../request-builder";
import { parseIdpMetadata } from "../service";

const sampleUser: SAMLUser = {
  nameId: "user@example.com",
  email: "user@example.com",
  name: "Test User",
  attributes: { role: "admin" },
  sessionIndex: "_session-123",
};

const sampleAssertion: SAMLAssertion = {
  issuer: "https://idp.example.com",
  destination: "https://sp.example.com/sso/acs",
  audience: "https://sp.example.com",
  recipient: "https://sp.example.com/sso/acs",
  notBefore: new Date(Date.now() - 60_000),
  notOnOrAfter: new Date(Date.now() + 60_000),
  validitySeconds: 120,
  user: sampleUser,
  signature: "mock-signature",
};

describe("SAML Parser", () => {
  it("isValidNameIdFormat gecerli formatlari kabul eder", () => {
    expect(isValidNameIdFormat("urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress")).toBe(true);
    expect(isValidNameIdFormat("urn:oasis:names:tc:SAML:2.0:nameid-format:persistent")).toBe(true);
    expect(isValidNameIdFormat("urn:oasis:names:tc:SAML:2.0:nameid-format:transient")).toBe(true);
  });

  it("isValidNameIdFormat gecersiz formatlari reddeder", () => {
    expect(isValidNameIdFormat("invalid")).toBe(false);
    expect(isValidNameIdFormat(null)).toBe(false);
    expect(isValidNameIdFormat(undefined)).toBe(false);
  });

  it("DEFAULT_NAME_ID_FORMAT emailAddress", () => {
    expect(DEFAULT_NAME_ID_FORMAT).toContain("emailAddress");
  });

  it("parseSAMLTimestamp ISO 8601 parse eder", () => {
    const d = parseSAMLTimestamp("2024-01-01T00:00:00Z");
    expect(d.getUTCFullYear()).toBe(2024);
  });

  it("parseSAMLTimestamp gecersiz icin throw", () => {
    expect(() => parseSAMLTimestamp("not-a-date")).toThrow();
  });

  it("isAssertionValid gecerli zaman araliginda true", () => {
    expect(isAssertionValid(
      new Date(Date.now() - 1000),
      new Date(Date.now() + 60_000)
    )).toBe(true);
  });

  it("isAssertionValid expired → false", () => {
    expect(isAssertionValid(
      new Date(Date.now() - 120_000),
      new Date(Date.now() - 60_000)
    )).toBe(false);
  });

  it("isAssertionValid notBefore henuz gelmemis → false", () => {
    expect(isAssertionValid(
      new Date(Date.now() + 60_000),
      new Date(Date.now() + 120_000)
    )).toBe(false);
  });

  it("isAssertionValid clock skew tolerance", () => {
    // 30 saniye once basladi, clock skew 60s → gecerli
    expect(isAssertionValid(
      new Date(Date.now() - 30_000),
      new Date(Date.now() + 30_000),
      new Date(),
      60
    )).toBe(true);
  });

  it("validateAudience beklenen SP entity ID iceriyorsa true", () => {
    expect(validateAudience(["https://sp.example.com"], "https://sp.example.com")).toBe(true);
  });

  it("validateAudience farkli audience → false", () => {
    expect(validateAudience(["https://other.com"], "https://sp.example.com")).toBe(false);
  });

  it("isValidEmail gecerli format", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("ali.yilmaz@firma.com.tr")).toBe(true);
  });

  it("isValidEmail gecersiz format", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });

  it("extractAttribute tekil string doner", () => {
    expect(extractAttribute({ role: "admin" }, "role")).toBe("admin");
  });

  it("extractAttribute array ilk elemani doner", () => {
    expect(extractAttribute({ role: ["admin", "user"] }, "role")).toBe("admin");
  });

  it("extractAttribute olmayan key null", () => {
    expect(extractAttribute({}, "missing")).toBe(null);
  });

  it("userFromAssertion gecerli user doner", () => {
    const u = userFromAssertion(sampleAssertion);
    expect(u).not.toBeNull();
    expect(u?.email).toBe("user@example.com");
  });

  it("userFromAssertion invalid email → null", () => {
    const bad = { ...sampleAssertion, user: { ...sampleUser, nameId: "not-email" } };
    expect(userFromAssertion(bad)).toBeNull();
  });
});

describe("SAML Request Builder", () => {
  const config = {
    spEntityId: "https://sp.example.com",
    spAcsUrl: "https://sp.example.com/sso/acs",
  };

  it("buildAuthnRequest XML üretir", () => {
    const xml = buildAuthnRequest(config);
    expect(xml).toContain("<samlp:AuthnRequest");
    expect(xml).toContain(`<saml:Issuer>${config.spEntityId}</saml:Issuer>`);
    expect(xml).toContain('xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"');
  });

  it("buildAuthnRequest custom requestId kullanir", () => {
    const xml = buildAuthnRequest(config, { requestId: "test-id-123" });
    expect(xml).toContain('ID="test-id-123"');
  });

  it("buildAuthnRequest forceAuthn option", () => {
    const xml = buildAuthnRequest(config, { forceAuthn: true });
    expect(xml).toContain('ForceAuthn="true"');
  });

  it("buildAuthnRequest default forceAuthn yok", () => {
    const xml = buildAuthnRequest(config);
    expect(xml).not.toContain("ForceAuthn");
  });

  it("buildAuthnRequest XML escape yapar", () => {
    const xml = buildAuthnRequest({
      spEntityId: "<script>alert(1)</script>",
      spAcsUrl: config.spAcsUrl,
    });
    expect(xml).not.toContain("<script>");
    expect(xml).toContain("&lt;script&gt;");
  });

  it("buildRedirectForm HTML form uretir", () => {
    const form = buildRedirectForm("https://idp.example.com/sso", "<xml/>");
    expect(form).toContain('<form method="POST"');
    expect(form).toContain('action="https://idp.example.com/sso"');
    expect(form).toContain('name="SAMLRequest"');
  });

  it("buildRedirectForm RelayState opsiyonel", () => {
    const withoutRelay = buildRedirectForm("https://idp.example.com", "<xml/>");
    expect(withoutRelay).not.toContain("RelayState");

    const withRelay = buildRedirectForm("https://idp.example.com", "<xml/>", "/dashboard");
    expect(withRelay).toContain('name="RelayState"');
    expect(withRelay).toContain("/dashboard");
  });
});

describe("SAML Metadata Parser", () => {
  it("parseIdpMetadata gecerli metadata parse eder", () => {
    const xml = `<?xml version="1.0"?>
<EntityDescriptor entityID="https://idp.example.com">
  <IDPSSODescriptor>
    <SingleSignOnService Binding="HTTP-POST" Location="https://idp.example.com/sso"/>
    <KeyDescriptor>
      <X509Certificate>MIIB...</X509Certificate>
    </KeyDescriptor>
  </IDPSSODescriptor>
</EntityDescriptor>`;
    const result = parseIdpMetadata(xml);
    expect(result).not.toBeNull();
    expect(result?.idpEntityId).toBe("https://idp.example.com");
    expect(result?.idpSsoUrl).toBe("https://idp.example.com/sso");
    expect(result?.idpCertificate).toBe("MIIB...");
  });

  it("parseIdpMetadata gecersiz metadata null doner", () => {
    expect(parseIdpMetadata("not-xml")).toBeNull();
    expect(parseIdpMetadata("")).toBeNull();
  });

  it("parseIdpMetadata eksik alan null doner", () => {
    const xml = `<EntityDescriptor entityID="https://idp.example.com"></EntityDescriptor>`;
    expect(parseIdpMetadata(xml)).toBeNull();
  });
});