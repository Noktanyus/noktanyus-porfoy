/**
 * @file SAML SSO Tests — L5
 * @description SAML facade testleri:
 *   - isSamlConfigured env detection
 *   - loadSamlConfig env okuma + metadata fallback (mocked fetch)
 *   - parseIdpMetadataXml regex extraction
 *   - generateSamlAuthRequest: SAMLRequest param icerir + IdP URL'ine redirect
 *   - verifySamlResponse: valid signed response → user; invalid signature →
 *     SamlValidationError; expired → error; wrong audience → error
 *   - createSamlMetadata: SP metadata XML
 *
 * NOT: Tam SAML XML imzalama / verify node-saml tarafindan yapilir.
 * Bu testler onun uzerindeki facade'i test eder (config loading, error
 * mapping, helper exports). node-saml'in kendi testleri kendi paketinde var.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { _internals, isSamlConfigured, loadSamlConfig } from "../saml";

// --- Mock node-saml (XML imzalama/verification agır islem) ---
vi.mock("@node-saml/node-saml", () => {
  const generateServiceProviderMetadata = vi.fn((params: any) =>
    `<?xml version="1.0"?>
<EntityDescriptor entityID="${params.issuer}">
  <SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="${params.wantAssertionsSigned}">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService index="0" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${params.callbackUrl}"/>
  </SPSSODescriptor>
</EntityDescriptor>`
  );

  class MockSAML {
    private config: any;
    constructor(config: any) {
      this.config = config;
    }
    getAuthorizeUrlAsync = vi.fn(async (relayState: string, _host: string) => {
      const samlRequest = Buffer.from(
        `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_mock" Version="2.0" IssueInstant="${new Date().toISOString()}" Destination="${this.config.entryPoint}" AssertionConsumerServiceURL="${this.config.callbackUrl}"><saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${this.config.issuer}</saml:Issuer></samlp:AuthnRequest>`
      ).toString("base64");
      const relayParam = relayState
        ? `&RelayState=${encodeURIComponent(relayState)}`
        : "";
      return `${this.config.entryPoint}?SAMLRequest=${encodeURIComponent(samlRequest)}${relayParam}`;
    });
    validatePostResponseAsync = vi.fn(async (container: Record<string, string>) => {
      const resp = container.SAMLResponse ?? "";
      // Mock davranis: "INVALID_SIGNATURE" iceriyorsa invalid_signature firlat,
      // "EXPIRED" iceriyorsa expired firlat, vs.
      if (/INVALID_SIGNATURE/.test(resp)) {
        throw new Error("Invalid signature");
      }
      if (/EXPIRED/.test(resp)) {
        throw new Error("Assertion has expired (NotOnOrAfter)");
      }
      if (/WRONG_AUDIENCE/.test(resp)) {
        throw new Error("Audience restriction violation");
      }
      if (/WRONG_ISSUER/.test(resp)) {
        throw new Error("Invalid issuer");
      }
      if (/MISSING_ASSERTION/.test(resp)) {
        return { profile: null, loggedOut: false };
      }
      // Basarili durum — fixture profile
      return {
        profile: {
          issuer: this.config.idpIssuer,
          nameID: "user@example.com",
          nameIDFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
          email: "user@example.com",
          sessionIndex: "_session-123",
          displayName: "Test User",
          role: "user",
        },
        loggedOut: false,
      };
    });
  }

  return {
    SAML: MockSAML,
    generateServiceProviderMetadata,
  };
});

// --- Mock logger ---
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// ============================================================================
// isSamlConfigured
// ============================================================================

describe("isSamlConfigured", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns true when SP + IdP cert + SSO URL + entityID set", () => {
    process.env.SAML_SP_ENTITY_ID = "https://sp.example.com";
    process.env.SAML_SP_ACS_URL = "https://sp.example.com/api/auth/saml/callback";
    process.env.SAML_IDP_CERT = "-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----";
    process.env.SAML_IDP_SSO_URL = "https://idp.example.com/sso";
    process.env.SAML_IDP_ENTITY_ID = "https://idp.example.com/entity";
    expect(isSamlConfigured()).toBe(true);
  });

  it("returns true when SAML_IDP_METADATA_URL set instead of cert", () => {
    process.env.SAML_SP_ENTITY_ID = "https://sp.example.com";
    process.env.SAML_SP_ACS_URL = "https://sp.example.com/api/auth/saml/callback";
    process.env.SAML_IDP_METADATA_URL = "https://idp.example.com/metadata.xml";
    process.env.SAML_IDP_SSO_URL = "https://idp.example.com/sso";
    expect(isSamlConfigured()).toBe(true);
  });

  it("returns false when SP_ENTITY_ID missing", () => {
    delete process.env.SAML_SP_ENTITY_ID;
    process.env.SAML_SP_ACS_URL = "https://sp.example.com/api/auth/saml/callback";
    process.env.SAML_IDP_CERT = "cert";
    process.env.SAML_IDP_SSO_URL = "https://idp.example.com/sso";
    expect(isSamlConfigured()).toBe(false);
  });

  it("returns false when SP_ACS_URL missing", () => {
    process.env.SAML_SP_ENTITY_ID = "https://sp.example.com";
    delete process.env.SAML_SP_ACS_URL;
    process.env.SAML_IDP_CERT = "cert";
    process.env.SAML_IDP_SSO_URL = "https://idp.example.com/sso";
    expect(isSamlConfigured()).toBe(false);
  });

  it("returns false when both SAML_IDP_CERT ve SAML_IDP_METADATA_URL missing", () => {
    process.env.SAML_SP_ENTITY_ID = "https://sp.example.com";
    process.env.SAML_SP_ACS_URL = "https://sp.example.com/api/auth/saml/callback";
    delete process.env.SAML_IDP_CERT;
    delete process.env.SAML_IDP_METADATA_URL;
    process.env.SAML_IDP_SSO_URL = "https://idp.example.com/sso";
    expect(isSamlConfigured()).toBe(false);
  });

  it("returns false when SAML_IDP_SSO_URL missing", () => {
    process.env.SAML_SP_ENTITY_ID = "https://sp.example.com";
    process.env.SAML_SP_ACS_URL = "https://sp.example.com/api/auth/saml/callback";
    process.env.SAML_IDP_CERT = "cert";
    delete process.env.SAML_IDP_SSO_URL;
    expect(isSamlConfigured()).toBe(false);
  });
});

// ============================================================================
// loadSamlConfig — env + metadata fallback
// ============================================================================

describe("loadSamlConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("env-only mode: SAML_IDP_CERT + SSO URL kullanilir", async () => {
    process.env.SAML_SP_ENTITY_ID = "https://sp.example.com";
    process.env.SAML_SP_ACS_URL = "https://sp.example.com/acs";
    process.env.SAML_IDP_CERT = "FAKE-CERT-PEM";
    process.env.SAML_IDP_SSO_URL = "https://idp.example.com/sso";
    process.env.SAML_IDP_ENTITY_ID = "https://idp.example.com";

    const cfg = await loadSamlConfig();
    expect(cfg).not.toBeNull();
    expect(cfg!.idpCert).toBe("FAKE-CERT-PEM");
    expect(cfg!.idpSsoUrl).toBe("https://idp.example.com/sso");
    expect(cfg!.idpEntityId).toBe("https://idp.example.com");
    expect(cfg!.spEntityId).toBe("https://sp.example.com");
  });

  it("metadata fetch fallback: SAML_IDP_METADATA_URL → cert (env bos ise)", async () => {
    process.env.SAML_SP_ENTITY_ID = "https://sp.example.com";
    process.env.SAML_SP_ACS_URL = "https://sp.example.com/acs";
    delete process.env.SAML_IDP_CERT;
    delete process.env.SAML_IDP_SSO_URL;
    delete process.env.SAML_IDP_ENTITY_ID;
    process.env.SAML_IDP_METADATA_URL = "https://idp.example.com/metadata.xml";

    // Mock fetch
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        `<?xml version="1.0"?>
<EntityDescriptor entityID="https://idp.example.com/from-metadata">
  <IDPSSODescriptor>
    <KeyDescriptor use="signing">
      <KeyInfo><X509Certificate>${"MIIDfromMeta".padEnd(100, "X")}</X509Certificate></KeyInfo>
    </KeyDescriptor>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://idp.example.com/sso-from-metadata"/>
  </IDPSSODescriptor>
</EntityDescriptor>`,
    } as any);

    const cfg = await loadSamlConfig();
    expect(cfg).not.toBeNull();
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://idp.example.com/metadata.xml",
      expect.objectContaining({ cache: "no-store" })
    );
    // Env bos oldugu icin metadata degerleri kullanilir
    expect(cfg!.idpCert).toContain("BEGIN CERTIFICATE");
    expect(cfg!.idpSsoUrl).toBe("https://idp.example.com/sso-from-metadata");
    expect(cfg!.idpEntityId).toBe("https://idp.example.com/from-metadata");
  });

  it("returns null when not configured", async () => {
    delete process.env.SAML_SP_ENTITY_ID;
    delete process.env.SAML_SP_ACS_URL;
    delete process.env.SAML_IDP_CERT;
    delete process.env.SAML_IDP_METADATA_URL;
    delete process.env.SAML_IDP_SSO_URL;
    expect(await loadSamlConfig()).toBeNull();
  });

  it("metadata fetch fail → env fallback (cert + SSO env'de set)", async () => {
    process.env.SAML_SP_ENTITY_ID = "https://sp.example.com";
    process.env.SAML_SP_ACS_URL = "https://sp.example.com/acs";
    process.env.SAML_IDP_CERT = "env-cert-pem";
    process.env.SAML_IDP_METADATA_URL = "https://idp.example.com/metadata.xml";
    process.env.SAML_IDP_SSO_URL = "https://idp.example.com/sso";
    process.env.SAML_IDP_ENTITY_ID = "https://idp.example.com/entity";

    const fetchSpy = vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("network"));
    const cfg = await loadSamlConfig();
    expect(fetchSpy).toHaveBeenCalled();
    // Metadata basarisiz → env degerleri kullanilir
    expect(cfg).not.toBeNull();
    expect(cfg!.idpCert).toBe("env-cert-pem");
    expect(cfg!.idpSsoUrl).toBe("https://idp.example.com/sso");
    expect(cfg!.idpEntityId).toBe("https://idp.example.com/entity");
  });

  it("returns null when idpCert eksik (metadata basarisiz + env'de cert yok)", async () => {
    process.env.SAML_SP_ENTITY_ID = "https://sp.example.com";
    process.env.SAML_SP_ACS_URL = "https://sp.example.com/acs";
    delete process.env.SAML_IDP_CERT;
    process.env.SAML_IDP_METADATA_URL = "https://idp.example.com/metadata.xml";
    process.env.SAML_IDP_SSO_URL = "https://idp.example.com/sso";
    process.env.SAML_IDP_ENTITY_ID = "https://idp.example.com/entity";

    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("network"));
    expect(await loadSamlConfig()).toBeNull();
  });
});

// ============================================================================
// parseIdpMetadataXml
// ============================================================================

describe("parseIdpMetadataXml", () => {
  it("extracts X509Certificate, SSO URL, entityID", () => {
    const xml = `<?xml version="1.0"?>
<EntityDescriptor entityID="https://idp.example.com/entity">
  <IDPSSODescriptor>
    <KeyDescriptor use="signing">
      <KeyInfo><X509Certificate>${"MIIDfake".padEnd(80, "X")}</X509Certificate></KeyInfo>
    </KeyDescriptor>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://idp.example.com/sso"/>
  </IDPSSODescriptor>
</EntityDescriptor>`;

    const md = _internals.parseIdpMetadataXml(xml);
    expect(md.entityId).toBe("https://idp.example.com/entity");
    expect(md.ssoUrl).toBe("https://idp.example.com/sso");
    expect(md.cert).toContain("BEGIN CERTIFICATE");
    expect(md.cert).toContain("END CERTIFICATE");
    expect(md.cert).not.toContain("\n  "); // whitespace'ler temizlenmis olmali
  });

  it("handles ds:X509Certificate (signed info) namespace", () => {
    const xml = `<EntityDescriptor entityID="urn:idp">
      <ds:X509Certificate>abc123</ds:X509Certificate>
      <SingleSignOnService Location="https://idp/sso"/>
    </EntityDescriptor>`;
    const md = _internals.parseIdpMetadataXml(xml);
    expect(md.entityId).toBe("urn:idp");
    expect(md.ssoUrl).toBe("https://idp/sso");
    expect(md.cert).toContain("BEGIN CERTIFICATE");
  });

  it("returns empty fields when nothing matches", () => {
    const md = _internals.parseIdpMetadataXml("<root/>");
    expect(md.entityId).toBe("");
    expect(md.ssoUrl).toBe("");
    expect(md.cert).toBe("");
  });
});

// ============================================================================
// generateSamlAuthRequest
// ============================================================================

describe("generateSamlAuthRequest", () => {
  it("returns IdP SSO URL with SAMLRequest + RelayState", async () => {
    const { generateSamlAuthRequest } = await import("../saml");
    const config = {
      idpCert: "cert",
      idpSsoUrl: "https://idp.example.com/sso",
      idpEntityId: "https://idp.example.com",
      spEntityId: "https://sp.example.com",
      spAcsUrl: "https://sp.example.com/acs",
    };

    const url = await generateSamlAuthRequest(config, "test-relay");
    expect(url).toContain("https://idp.example.com/sso");
    expect(url).toContain("SAMLRequest=");
    expect(url).toContain("RelayState=test-relay");
  });

  it("omits RelayState when empty", async () => {
    const { generateSamlAuthRequest } = await import("../saml");
    const config = {
      idpCert: "cert",
      idpSsoUrl: "https://idp.example.com/sso",
      idpEntityId: "https://idp.example.com",
      spEntityId: "https://sp.example.com",
      spAcsUrl: "https://sp.example.com/acs",
    };
    const url = await generateSamlAuthRequest(config, "");
    expect(url).not.toContain("RelayState=");
  });

  it("throws SamlValidationError when config incomplete", async () => {
    const { generateSamlAuthRequest } = await import("../saml");
    await expect(
      generateSamlAuthRequest(
        {
          idpCert: "",
          idpSsoUrl: "https://idp",
          idpEntityId: "https://idp",
          spEntityId: "https://sp",
          spAcsUrl: "https://sp/acs",
        },
        ""
      )
    ).rejects.toThrow(/konfigurasyonu eksik/i);
  });
});

// ============================================================================
// verifySamlResponse
// ============================================================================

describe("verifySamlResponse", () => {
  const baseConfig = {
    idpCert: "cert",
    idpSsoUrl: "https://idp.example.com/sso",
    idpEntityId: "https://idp.example.com",
    spEntityId: "https://sp.example.com",
    spAcsUrl: "https://sp.example.com/acs",
  };

  it("valid signed response → parsed claims", async () => {
    const { verifySamlResponse } = await import("../saml");
    const user = await verifySamlResponse(baseConfig, "valid-saml-response");
    expect(user.email).toBe("user@example.com");
    expect(user.nameId).toBe("user@example.com");
    expect(user.nameIdFormat).toBe("urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress");
    expect(user.sessionIndex).toBe("_session-123");
    expect(user.attributes.displayName).toBe("Test User");
  });

  it("invalid signature → SamlValidationError invalid_signature", async () => {
    const { verifySamlResponse, SamlValidationError } = await import("../saml");
    await expect(
      verifySamlResponse(baseConfig, "INVALID_SIGNATURE-mock")
    ).rejects.toThrow(SamlValidationError);
    try {
      await verifySamlResponse(baseConfig, "INVALID_SIGNATURE-mock");
    } catch (err) {
      expect(err).toBeInstanceOf(SamlValidationError);
      expect((err as any).reason).toBe("invalid_signature");
    }
  });

  it("expired assertion → SamlValidationError expired", async () => {
    const { verifySamlResponse, SamlValidationError } = await import("../saml");
    try {
      await verifySamlResponse(baseConfig, "EXPIRED-mock");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(SamlValidationError);
      expect((err as any).reason).toBe("expired");
    }
  });

  it("wrong audience → SamlValidationError wrong_audience", async () => {
    const { verifySamlResponse, SamlValidationError } = await import("../saml");
    try {
      await verifySamlResponse(baseConfig, "WRONG_AUDIENCE-mock");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(SamlValidationError);
      expect((err as any).reason).toBe("wrong_audience");
    }
  });

  it("wrong issuer → SamlValidationError wrong_issuer", async () => {
    const { verifySamlResponse, SamlValidationError } = await import("../saml");
    try {
      await verifySamlResponse(baseConfig, "WRONG_ISSUER-mock");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(SamlValidationError);
      expect((err as any).reason).toBe("wrong_issuer");
    }
  });

  it("missing assertion (profile null) → SamlValidationError missing_assertion", async () => {
    const { verifySamlResponse, SamlValidationError } = await import("../saml");
    try {
      await verifySamlResponse(baseConfig, "MISSING_ASSERTION-mock");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(SamlValidationError);
      expect((err as any).reason).toBe("missing_assertion");
    }
  });

  it("empty SAMLResponse → missing_response", async () => {
    const { verifySamlResponse, SamlValidationError } = await import("../saml");
    try {
      await verifySamlResponse(baseConfig, "");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(SamlValidationError);
      expect((err as any).reason).toBe("missing_response");
    }
  });
});

// ============================================================================
// createSamlMetadata
// ============================================================================

describe("createSamlMetadata", () => {
  it("generates SP metadata XML with correct entityID + ACS URL", async () => {
    const { createSamlMetadata } = await import("../saml");
    const xml = await createSamlMetadata({
      idpCert: "cert",
      idpSsoUrl: "https://idp.example.com/sso",
      idpEntityId: "https://idp.example.com",
      spEntityId: "https://sp.example.com",
      spAcsUrl: "https://sp.example.com/acs",
      wantAssertionsSigned: true,
    });
    expect(xml).toContain("entityID=\"https://sp.example.com\"");
    expect(xml).toContain('AssertionConsumerService');
    expect(xml).toContain('Location="https://sp.example.com/acs"');
    expect(xml).toContain('WantAssertionsSigned="true"');
  });
});

// ============================================================================
// samlProvider legacy facade
// ============================================================================

describe("samlProvider legacy facade", () => {
  it("isEnabled delegates to isSamlConfigured", async () => {
    const { samlProvider } = await import("../saml");
    expect(typeof samlProvider.isEnabled).toBe("function");
    expect(samlProvider.isEnabled).toBe(isSamlConfigured);
  });
});
