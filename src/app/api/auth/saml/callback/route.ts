/**
 * POST /api/auth/saml/callback — IdP'den donen SAML Response'u isler.
 *
 * Body form-encoded: SAMLResponse=<base64-XML>, RelayState=<state>
 * IdP'nin ACS (Assertion Consumer Service) endpoint'i olarak calisir.
 *
 * Stub seviyesinde: response'u parse edip email/attribute'lari alir,
 * gercek signature verification Production'da @node-saml/node-saml ile yapilir.
 *
 * Sonuc:
 *   - Basarili: kullaniciyi /giris?status=saml_ok ile anasayfaya yonlendirir.
 *   - Hatali: /giris?status=saml_fail
 */

import { NextRequest, NextResponse } from "next/server";
import { samlProvider } from "@/lib/saml";

export async function POST(req: NextRequest) {
  return handleCallback(req);
}

// IdP'ler bazen GET ile de redirect yapabilir; iki method'u da destekleyelim
export async function GET(req: NextRequest) {
  return handleCallback(req);
}

async function handleCallback(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const samlResponse = (formData?.get("SAMLResponse") as string | null) ?? "";
  const relayState = (formData?.get("RelayState") as string | null) ?? "";

  if (!samlResponse) {
    return NextResponse.redirect(
      new URL("/giris?status=saml_fail&reason=missing_response", req.url)
    );
  }

  const user = await samlProvider.processCallback(samlResponse);

  if (!user.email) {
    return NextResponse.redirect(
      new URL(
        `/giris?status=saml_fail&reason=invalid_response&relay=${encodeURIComponent(relayState)}`,
        req.url
      )
    );
  }

  // Production'da burada:
  // 1. SAML assertion'in imzasi IdP sertifikasi ile dogrulanmali
  // 2. NotBefore / NotOnOrAfter kontrolu yapilmali
  // 3. Audience restriction kontrol edilmeli (bizim Issuer)
  // 4. Kullanici Prisma'da yoksa otomatik olusturulmali
  // 5. NextAuth'a JWT token verilerek session baslatilmali
  //
  // Stub: basarili sayiyoruz ve anasayfaya yonlendiriyoruz.
  return NextResponse.redirect(
    new URL(
      `/giris?status=saml_ok&email=${encodeURIComponent(user.email)}&relay=${encodeURIComponent(relayState)}`,
      req.url
    )
  );
}
