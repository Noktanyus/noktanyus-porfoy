/**
 * GET /api/v1/cargo/carriers — Desteklenen Türk kargo firmaları ve şablonları
 */

import { NextResponse } from 'next/server';
import { TURKISH_CARRIERS } from '@/modules/tr-api';

export async function GET() {
  const list = Object.values(TURKISH_CARRIERS).map((c) => ({
    code: c.code,
    name: c.name,
    shortName: c.shortName,
    website: c.website,
    phone: c.phone,
    description: c.patterns.description,
  }));

  return NextResponse.json({
    success: true,
    data: {
      count: list.length,
      carriers: list,
    },
  });
}
