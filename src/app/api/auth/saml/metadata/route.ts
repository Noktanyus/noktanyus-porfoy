/**
 * @file GET /api/auth/saml/metadata — SP metadata.xml.
 *
 * IdP'nin SP'yi tanimasi icin gereken XML metadata belgesi.
 * IdP admin'i bu URL'i kullanarak SP konfigurasyonunu yapar.
 *
 * SAML yapilandirilmamissa 503 doner.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  isSamlConfigured,
  loadSamlConfig,
  createSamlMetadata,
} from "@/lib/saml";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  if (!isSamlConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "SAML_DISABLED", message: "SAML SSO yapılandırılmamış" },
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

  try {
    const xml = await createSamlMetadata(config);
    logger.info("[saml] metadata generated", {
      spEntityId: config.spEntityId,
      spAcsUrl: config.spAcsUrl,
    });
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/samlmetadata+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    logger.error("[saml] metadata generation failed", { err });
    return NextResponse.json(
      {
        success: false,
        error: { code: "SAML_METADATA_FAILED", message: "Metadata üretilemedi" },
      },
      { status: 500 }
    );
  }
}
