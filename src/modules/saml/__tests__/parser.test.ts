/**
 * @file SAML module tests — production-ready @node-saml/node-saml entegrasyonu
 * @description D3: parser, request builder (deprecated), service testleri.
 */

import { describe, it, expect, vi } from "vitest";
import {
  isValidNameIdFormat,
  isValidEmail,
  extractAttribute,
  normalizeProfile,
  validateAudience,
  escapeXml,
  isTimestampInWindow,
  DEFAULT_NAME_ID_FORMAT,
  type SAMLUser,
} from "../parser";
import { parseIdpMetadata, clearSAMLConfigCache } from "../service";
import {
  buildAuthnRequest,
  buildRedirectForm,
} from "../request-builder";

// node-saml modülünü mock'la (test ortamında crypto sertifika ihtiyaçları için)
vi.mock("@node-saml/node-saml", () => {
  class MockSAML {
    options: Record<string, unknown>;
    constructor(opts: Record<string, unknown>) {
      this.options = opts;
    }
    async getAuthorizeFormAsync() {
      return "<form method=\"POST\"><input name=\"SAMLRequest\"/></form>";
    }
    async getAuthorizeUrlAsync() {
      return "https://idp.example.com/sso?SAMLRequest=abc";
    }
    async validatePostResponseAsync() {
      return {
        profile: {
          nameID: "user@example.com",
          issuer: "https://idp.example.com",
          sessionIndex: "_session-123",
          attributes: { email: "user@example.com", role: "admin", name: "Test User" },
          nameIDFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
        },
        loggedOut: false,
      };
    }
  }
  return { SAML: MockSAML };
});

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
    expect(isValidNameIdFormat(123)).toBe(false);
  });

  it("DEFAULT_NAME_ID_FORMAT emailAddress", () => {
    expect(DEFAULT_NAME_ID_FORMAT).toContain("emailAddress");
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

  it("extractAttribute invalid type null doner", () => {
    expect(extractAttribute({ role: 123 }, "role")).toBe(null);
    expect(extractAttribute({ role: { nested: true } }, "role")).toBe(null);
  });

  it("validateAudience beklenen SP entity ID iceriyorsa true", () => {
    expect(validateAudience(["https://sp.example.com"], "https://sp.example.com")).toBe(true);
  });

  it("validateAudience farkli audience → false", () => {
    expect(validateAudience(["https://other.com"], "https://sp.example.com")).toBe(false);
  });

  it("validateAudience bos array → false", () => {
    expect(validateAudience([], "https://sp.example.com")).toBe(false);
  });

  it("escapeXml temel karakterleri escape eder", () => {
    expect(escapeXml("<script>")).toBe("&lt;script&gt;");
    expect(escapeXml('a & b "c"')).toBe("a &amp; b &quot;c&quot;");
    expect(escapeXml("it's")).toBe("it&apos;s");
  });

  it("isTimestampInWindow gecerli aralikta true", () => {
    const now = Date.now();
    expect(
      isTimestampInWindow(
        new Date(now - 1000),
        new Date(now + 60_000),
        now,
        60
      )
    ).toBe(true);
  });

  it("isTimestampInWindow expired → false", () => {
    const now = Date.now();
    expect(
      isTimestampInWindow(
        new Date(now - 120_000),
        new Date(now - 60_000),
        now,
        60
      )
    ).toBe(false);
  });

  it("isTimestampInWindow notBefore henuz gelmemis → false", () => {
    const now = Date.now();
    expect(
      isTimestampInWindow(
        new Date(now + 60_000),
        new Date(now + 120_000),
        now,
        60
      )
    ).toBe(false);
  });

  it("isTimestampInWindow ISO string kabul eder", () => {
    const now = new Date();
    const start = new Date(now.getTime() - 1000).toISOString();
    const end = new Date(now.getTime() + 60_000).toISOString();
    expect(isTimestampInWindow(start, end)).toBe(true);
  });

  it("isTimestampInWindow invalid date → false", () => {
    expect(isTimestampInWindow("not-a-date", new Date())).toBe(false);
  });
});

describe("SAML Profile Normalization", () => {
  it("normalizeProfile gecerli profile doner", () => {
    const profile = {
      nameID: "user@example.com",
      issuer: "https://idp.example.com",
      sessionIndex: "_s1",
      attributes: {
        email: ["user@example.com"],
        name: "Test User",
        role: "admin",
      },
      nameIDFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    };
    const user = normalizeProfile(profile, "https://idp.example.com");
    expect(user).not.toBeNull();
    expect(user?.email).toBe("user@example.com");
    expect(user?.issuer).toBe("https://idp.example.com");
    expect(user?.sessionIndex).toBe("_s1");
    expect(user?.nameIdFormat).toContain("emailAddress");
  });

  it("normalizeProfile nameID'den email fallback yapar", () => {
    const profile = {
      nameID: "fallback@example.com",
      issuer: "https://idp.example.com",
      sessionIndex: "",
      attributes: { role: "user" },
    };
    const user = normalizeProfile(profile, "https://idp.example.com");
    expect(user?.email).toBe("fallback@example.com");
  });

  it("normalizeProfile invalid email → null", () => {
    const profile = {
      nameID: "not-an-email",
      issuer: "https://idp.example.com",
      sessionIndex: "",
      attributes: {},
    };
    expect(normalizeProfile(profile, "https://idp.example.com")).toBeNull();
  });

  it("normalizeProfile attributes array normalize eder", () => {
    const profile = {
      nameID: "user@example.com",
      issuer: "https://idp.example.com",
      sessionIndex: "",
      attributes: {
        groups: ["admin", "users", "developers"],
      },
    };
    const user = normalizeProfile(profile, "https://idp.example.com");
    expect(user?.attributes.groups).toEqual(["admin", "users", "developers"]);
  });

  it("normalizeProfile attributes'ta invalid type filtrelenir", () => {
    const profile = {
      nameID: "user@example.com",
      issuer: "https://idp.example.com",
      sessionIndex: "",
      attributes: {
        valid: ["a", "b"],
        mixed: ["ok", 123, null, "fine"],
      },
    };
    const user = normalizeProfile(profile, "https://idp.example.com");
    expect(user?.attributes.valid).toEqual(["a", "b"]);
    expect(user?.attributes.mixed).toEqual(["ok", "fine"]);
  });
});

describe("SAML Request Builder (deprecated)", () => {
  it("buildAuthnRequest kullanım dışı hatası fırlatır", () => {
    expect(() => buildAuthnRequest({
      spEntityId: "https://sp.example.com",
      spAcsUrl: "https://sp.example.com/acs",
    })).toThrow(/kullanım dışı/);
  });

  it("buildRedirectForm kullanım dışı hatası fırlatır", () => {
    expect(() => buildRedirectForm("https://idp.example.com", "<xml/>")).toThrow(/kullanım dışı/);
  });
});

describe("SAML Metadata Parser", () => {
  it("parseIdpMetadata gecerli metadata parse eder", () => {
    const xml = `<?xml version="1.0"?>
<EntityDescriptor entityID="https://idp.example.com">
  <IDPSSODescriptor>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://idp.example.com/sso"/>
    <KeyDescriptor>
      <X509Certificate>MIIB</X509Certificate>
    </KeyDescriptor>
  </IDPSSODescriptor>
</EntityDescriptor>`;
    const result = parseIdpMetadata(xml);
    expect(result).not.toBeNull();
    expect(result?.idpEntityId).toBe("https://idp.example.com");
    expect(result?.idpSsoUrl).toBe("https://idp.example.com/sso");
    // PEM header otomatik eklenir
    expect(result?.idpCertificate).toContain("BEGIN CERTIFICATE");
  });

  it("parseIdpMetadata mevcut PEM header korur", () => {
    const cert = "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----";
    const xml = `<?xml version="1.0"?>
<EntityDescriptor entityID="https://idp.example.com">
  <IDPSSODescriptor>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://idp.example.com/sso"/>
    <KeyDescriptor>
      <X509Certificate>${cert}</X509Certificate>
    </KeyDescriptor>
  </IDPSSODescriptor>
</EntityDescriptor>`;
    const result = parseIdpMetadata(xml);
    expect(result?.idpCertificate).toBe(cert.trim());
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

describe("SAML Service — node-saml integration", () => {
  beforeEach(() => clearSAMLConfigCache());

  it("samlAuthService singleton pattern cache kullanir", async () => {
    const { samlAuthService } = await import("../service");
    // DB yok — service fonksiyonları null/empty donmeli (mock ortamında)
    // Burada fonksiyon varlığını ve tipini kontrol ediyoruz
    expect(typeof samlAuthService.getAuthorizeForm).toBe("function");
    expect(typeof samlAuthService.getAuthorizeUrl).toBe("function");
    expect(typeof samlAuthService.validateResponse).toBe("function");
    expect(typeof samlAuthService.findOrCreateUser).toBe("function");
  });

  it("samlConfigService API yuzeyi mevcut", async () => {
    const { samlConfigService } = await import("../service");
    expect(typeof samlConfigService.getConfig).toBe("function");
    expect(typeof samlConfigService.upsertConfig).toBe("function");
    expect(typeof samlConfigService.disableConfig).toBe("function");
  });

  it("samlAuthService.mapRoleFromAttributes admin", async () => {
    const { samlAuthService } = await import("../service");
    expect(samlAuthService.mapRoleFromAttributes({ role: "admin" })).toBe("admin");
    expect(samlAuthService.mapRoleFromAttributes({ role: "ADMIN" })).toBe("admin");
    expect(samlAuthService.mapRoleFromAttributes({ role: "Administrator" })).toBe("admin");
  });

  it("samlAuthService.mapRoleFromAttributes moderator", async () => {
    const { samlAuthService } = await import("../service");
    expect(samlAuthService.mapRoleFromAttributes({ role: "moderator" })).toBe("moderator");
    expect(samlAuthService.mapRoleFromAttributes({ role: "Mod" })).toBe("moderator");
  });

  it("samlAuthService.mapRoleFromAttributes default user", async () => {
    const { samlAuthService } = await import("../service");
    expect(samlAuthService.mapRoleFromAttributes({ role: "guest" })).toBe("user");
    expect(samlAuthService.mapRoleFromAttributes({})).toBe("user");
  });
});