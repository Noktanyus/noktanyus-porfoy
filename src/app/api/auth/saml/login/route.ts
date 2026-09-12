/**
 * @file GET /api/auth/saml/login — SAML SSO AuthnRequest baslatir.
 *
 * SAML yapilandirilmamissa 503 doner. Yapilandirilmissa AuthnRequest uretir
 * ve IdP'nin SSO endpoint'ine redirect eder.
 *
 * Query params:
 *   - relayState (opsiyonel): login sonrasi geri donulecek URL (CSRF token)
 *   - workspaceId (opsiyonel): multi-tenant workspace icin (ileride)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  isSamlConfigured,
  loadSamlConfig,
  generateSamlAuthRequest,
} from "@/lib/saml";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isSamlConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SAML_DISABLED",
          message: "SAML SSO yapılandırılmamış",
        },
      },
      { status: 503 }
    );
  }

  const config = await loadSamlConfig();
  if (!config) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "SAML_CONFIG_ERROR", message: "SAML konfigürasyon hatası" },
      },
      { status: 500 }
    );
  }

  const relayState = req.nextUrl.searchParams.get("relayState") ?? "";

  try {
    const authUrl = await generateSamlAuthRequest(config, relayState);
    logger.info("[saml] SSO login initiated", {
      relayState: relayState ? "set" : "empty",
      idpEntityId: config.idpEntityId,
    });
    return NextResponse.redirect(authUrl);
  } catch (err) {
    logger.error("[saml] generateSamlAuthRequest failed", { err });
    return NextResponse.json(
      {
        success: false,
        error: { code: "SAML_REQUEST_FAILED", message: "AuthnRequest üretilemedi" },
      },
      { status: 500 }
    );
  }
}
