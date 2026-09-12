/**
 * @file POST /api/auth/saml/callback — IdP'den donen SAML Response'u isler.
 *
 * IdP'nin ACS (Assertion Consumer Service) endpoint'i olarak calisir.
 * Body form-encoded: SAMLResponse=<base64-XML>, RelayState=<state>
 *
 * Akis:
 *   1. SAMLResponse base64 al
 *   2. node-saml validatePostResponseAsync ile signature + conditions +
 *      audience + issuer kontrol
 *   3. Email/NameID extract
 *   4. User upsert (yoksa olustur, varsa guncelle)
 *   5. NextAuth session baslat (JWT cookie set)
 *   6. Relay state URL'ine redirect
 *
 * Hata durumunda: /giris?status=saml_fail&reason=...&relay=...
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isSamlConfigured,
  loadSamlConfig,
  verifySamlResponse,
  SamlValidationError,
} from "@/lib/saml";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

async function handleCallback(req: NextRequest) {
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

  // Form data parse (HTTP-POST binding)
  const formData = await req.formData().catch(() => null);
  const samlResponse = (formData?.get("SAMLResponse") as string | null) ?? "";
  const relayState = (formData?.get("RelayState") as string | null) ?? "";

  if (!samlResponse) {
    logger.warn("[saml] callback: missing SAMLResponse");
    return NextResponse.redirect(
      new URL("/giris?status=saml_fail&reason=missing_response", req.url)
    );
  }

  // Signature + Conditions + Audience + Issuer verification
  let user;
  try {
    user = await verifySamlResponse(config, samlResponse, relayState);
  } catch (err) {
    const reason =
      err instanceof SamlValidationError ? err.reason : "unknown";
    const message = err instanceof Error ? err.message : String(err);

    logger.warn("[saml] callback: validation failed", { reason, message });

    return NextResponse.redirect(
      new URL(
        `/giris?status=saml_fail&reason=${encodeURIComponent(reason)}&relay=${encodeURIComponent(relayState)}`,
        req.url
      )
    );
  }

  // User upsert — ilk kez giren otomatik kaydedilir
  try {
    const dbUser = await prisma.user.upsert({
      where: { email: user.email.toLowerCase() },
      update: {
        // Email degismez (IdP authoritative), ama last login bilgisi guncelle
        emailVerified: new Date(),
      },
      create: {
        email: user.email.toLowerCase(),
        name:
          (user.attributes["displayName"] as string | undefined) ||
          (user.attributes["name"] as string | undefined) ||
          user.email.split("@")[0] ||
          "SAML User",
        emailVerified: new Date(),
      },
      select: { id: true, email: true, name: true },
    });

    logger.info("[saml] callback: user authenticated", {
      userId: dbUser.id,
      email: dbUser.email,
      issuer: user.issuer,
      sessionIndex: user.sessionIndex ? "set" : "none",
    });

    // SAML'den NextAuth session'a gecis:
    // Bu endpoint'te NextAuth CredentialsProvider'a ozel bir "saml-bridge"
    // token olusturulup, kullanicinin /api/auth/callback/saml uzerinden
    // session baslatmasi saglanabilir.
    //
    // Alternatif: dogrudan NextAuth JWT cookie set et (httpOnly + secure).
    // Bu prod ortaminda Auth.js'in "cookies" API'si ile yapilir; burada
    // basit lastLogin cookie ile "saml pending" state'i set ediyoruz,
    // /api/auth/saml/session endpoint'i JWT'yi tamamlar.

    const res = NextResponse.redirect(
      new URL(
        `/giris?status=saml_ok&email=${encodeURIComponent(dbUser.email)}&relay=${encodeURIComponent(relayState)}`,
        req.url
      )
    );
    // SAML-authenticated userId — NextAuth signIn callback'i tarafindan tuketilebilir
    res.cookies.set("saml_user_id", dbUser.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 5 * 60, // 5 dakika — kisa omurlu, sadece signIn handshake icin
    });
    res.cookies.set("saml_session_index", user.sessionIndex ?? "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 5 * 60,
    });
    return res;
  } catch (err) {
    logger.error("[saml] callback: user upsert failed", { err });
    return NextResponse.redirect(
      new URL(
        `/giris?status=saml_fail&reason=db_error&relay=${encodeURIComponent(relayState)}`,
        req.url
      )
    );
  }
}

export async function POST(req: NextRequest) {
  return handleCallback(req);
}

// IdP'ler bazen GET ile de redirect yapabilir; iki method'u da destekleyelim
export async function GET(req: NextRequest) {
  return handleCallback(req);
}
