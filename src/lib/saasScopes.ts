/**
 * SaaS API Scopes — Phase 2 A.5
 *
 * /api/saas/* altındaki public endpoint'lerin scope tanımları.
 * withApiKey middleware'inin `hasScope()` helper'ı bu scope adlarını doğrudan
 * kabul eder; yeni bir middleware gerekmez. Admin scope'u zaten tüm
 * scope'ları kapsadığı için (apiKeyMiddleware.ts:hasScope) SaaS admin'leri
 * de otomatik yetkilendirilir.
 *
 * Scope listesi:
 *   ai:describe:write   — Tekil AI ürün açıklaması üretme
 *   ai:bulk:write       — CSV toplu üretim işi başlatma
 *   ai:brand-voice:write — Marka sesi eğitimi (train)
 *   ai:describe:read    — (opsiyonel) Sonuç okuma — şimdilik auth'lu user/ai endpointleri kullanıyor
 */

export const SAAS_SCOPES = {
  'ai:describe:read': 'AI description okuma',
  'ai:describe:write': 'AI description oluşturma',
  'ai:bulk:write': 'Toplu üretim',
  'ai:brand-voice:write': 'Marka sesi eğitimi',
} as const;

export type SaasScope = keyof typeof SAAS_SCOPES;

/**
 * Scope adları dizisi. Zod enum'ları ve array validasyonları için.
 */
export const SAAS_SCOPE_NAMES = Object.keys(SAAS_SCOPES) as SaasScope[];

/**
 * Bu helper, withApiKey içinden dönen `scopes` dizisi üzerinde scope kontrolü
 * yapar. Admin scope'u varsa tüm scope'lar geçer. Aksi halde tam eşleşme gerekir.
 *
 * Kullanım (route handler içinde):
 *   const ctx = (validation as ApiKeyContext);
 *   if (!hasSaasScope(ctx.scopes, 'ai:describe:write')) {
 *     return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', ... } }, { status: 403 });
 *   }
 *
 * NOT: withApiKey middleware'i zaten scope kontrolü yapmıyor — endpoint bazlı
 * bu helper'ı kullanmak route handler'a bırakıldı (esneklik için). Bazı
 * endpoint'ler birden fazla scope'u kabul edebilir (örn. /jobs okuma +
 * /jobs export hem describe:read hem bulk:write ile çalışabilir).
 */
export function hasSaasScope(
  scopes: readonly string[],
  required: SaasScope | readonly SaasScope[]
): boolean {
  if (scopes.includes('admin')) return true;
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.some((s) => scopes.includes(s));
}

import { NextResponse } from 'next/server';

/**
 * Tek satırlık scope kontrolü + 403 NextResponse üretir. Route handler'larında
 * erken dönüş için:
 *
 *   const scopeError = ensureSaasScope(ctx.scopes, 'ai:describe:write');
 *   if (scopeError) return scopeError;
 */
export function ensureSaasScope(
  scopes: readonly string[],
  required: SaasScope | readonly SaasScope[]
): NextResponse | null {
  if (hasSaasScope(scopes, required)) return null;
  const list = Array.isArray(required) ? required.join(', ') : required;
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Bu endpoint için yetkiniz yok. Gerekli scope: ${list}`,
      },
    },
    { status: 403 }
  );
}
