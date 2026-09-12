/**
 * @file POST /api/auth/saml/slo — SAML Single Logout (SLO) handler (future).
 *
 * Bu endpoint SLO protokolunu desteklemek icin hazirlanmistir. Tam SLO
 * implementasyonu icin IdP'nin LogoutResponse gondermesi, sessionIndex ile
 * kullanicinin tum aktif session'larinin sonlandirilmasi gerekir.
 *
 * Simdilik 501 Not Implemented doner — gercek logout session cookie temizleme
 * NextAuth uzerinden yapilir (/api/auth/signout).
 *
 * Ileride:
 *   1. SAML LogoutRequest parse et
 *   2. node-saml validateLogoutRequest ile verify
 *   3. User session terminate et
 *   4. node-saml generateLogoutResponse ile IdP'ye response uret
 *   5. Redirect ile IdP logout tamamla
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  // SAML SLO tam implementasyonu backlog'a alındı (NOKT-PLAT-142).
  // Şimdilik 501 döneriz; logout NextAuth üzerinden (/api/auth/signout) yapılıyor.
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "SLO_NOT_IMPLEMENTED",
        message:
          "SAML Single Logout henüz implemente edilmedi. /api/auth/signout kullanın.",
      },
    },
    { status: 501 }
  );
}

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "SLO_NOT_IMPLEMENTED",
        message:
          "SAML Single Logout henüz implemente edilmedi. /api/auth/signout kullanın.",
      },
    },
    { status: 501 }
  );
}
