/**
 * GET /api/auth/saml — SAML SSO AuthnRequest baslatir, kullaniciyi IdP'ye
 * redirect eder.
 *
 * SAML yapilandirilmamissa 503 doner.
 *
 * Query params:
 *   - relayState (opsiyonel): login sonrasi geri donulecek URL (CSRF token)
 */

import { NextRequest, NextResponse } from "next/server";
import { samlProvider } from "@/lib/saml";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  if (!samlProvider.isEnabled()) {
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

  const config = samlProvider.loadConfig();
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
  const authUrl = samlProvider.generateAuthUrl(config, relayState);

  logger.info("SAML SSO initiated", { relayState: relayState ? "set" : "empty" });

  // 302 redirect ile IdP'nin login sayfasina yonlendir
  return NextResponse.redirect(authUrl);
}
