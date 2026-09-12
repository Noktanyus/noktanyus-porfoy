/**
 * @file GET /api/openapi — OpenAPI 3.1.0 JSON spec
 * @description Spec'i JSON olarak döner. Frontend Redoc embed (`/docs`) bu
 *              endpoint'i fetch'ler; harici API consumer'lar (Postman, SDK
 *              generator) için de aynı URL kullanılır.
 *              Cache: 5 dakika + immutable client cache (spec statik değil,
 *              build sırasında generate edilir — güncellemeler deploy ile gelir).
 */

import { NextResponse } from 'next/server';
import { OPENAPI_SPEC_JSON } from '@/lib/openapi';

export const dynamic = 'force-static';
// Spec build sırasında dondurulur; ISR ile güncellenir.
export const revalidate = 300; // 5 dakika

export function GET() {
  return new NextResponse(OPENAPI_SPEC_JSON, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}