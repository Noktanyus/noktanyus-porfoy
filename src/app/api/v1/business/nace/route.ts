/**
 * POST /api/v1/business/nace — Türkiye NACE Kodu & İSG Tehlike Sınıfı Rehberi API
 * 6 haneli NACE kodları, faaliyet açıklamaları ve 6331 s. İSG tehlike sınıfları.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import {
  searchNace,
  getNaceByCode,
  NACE_CATALOG,
} from '@/modules/tr-api/nace';

const NaceSchema = z.object({
  query: z.string().optional(),
  code: z.string().optional(),
  dangerLevel: z.enum(['az_tehlikeli', 'tehlikeli', 'cok_tehlikeli']).optional(),
  sector: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional().default(50),
});

export const POST = withTrApi(NaceSchema, async (data) => {
  if (data.code) {
    const item = getNaceByCode(data.code);
    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Belirtilen NACE kodu (${data.code}) bulunamadı.`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  }

  const results = searchNace(data.query || '', {
    dangerLevel: data.dangerLevel,
    sector: data.sector,
    limit: data.limit,
  });

  return NextResponse.json({
    success: true,
    data: {
      totalFound: results.length,
      totalCatalog: NACE_CATALOG.length,
      results,
    },
  });
});
